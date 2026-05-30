"use client";

import { nanoid } from "nanoid";
import { useSession } from "next-auth/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { reorderItems as applyReorder } from "@/lib/sort";
import { loadItems, saveItems } from "@/lib/storage";
import type { LeisureItem, LeisureStatus } from "@/lib/types";

const SAVE_DEBOUNCE_MS = 600;

interface LeisureItemsContextValue {
  items: LeisureItem[];
  ready: boolean;
  syncing: boolean;
  cloudEnabled: boolean;
  isSignedIn: boolean;
  sessionReady: boolean;
  addItem: (item: Omit<LeisureItem, "id" | "createdAt" | "order">) => LeisureItem;
  updateItem: (id: string, patch: Partial<LeisureItem>) => void;
  removeItem: (id: string) => void;
  setStatus: (id: string, status: LeisureStatus) => void;
  reorderItems: (activeId: string, overId: string) => void;
  replaceAll: (next: LeisureItem[]) => void;
}

const LeisureItemsContext = createContext<LeisureItemsContextValue | null>(null);

async function fetchCloudItems(): Promise<LeisureItem[] | null> {
  const res = await fetch("/api/items");
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { items: LeisureItem[] };
  return Array.isArray(data.items) ? data.items : null;
}

async function saveCloudItems(items: LeisureItem[]): Promise<boolean> {
  const res = await fetch("/api/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return res.ok;
}

const inflightLoads = new Map<string, Promise<{ items: LeisureItem[]; cloud: boolean }>>();

function loadItemsForAuth(isSignedIn: boolean): Promise<{ items: LeisureItem[]; cloud: boolean }> {
  const key = isSignedIn ? "signed-in" : "guest";
  const existing = inflightLoads.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const local = loadItems();

    if (isSignedIn) {
      const cloud = await fetchCloudItems();
      if (cloud !== null) {
        if (cloud.length > 0) {
          saveItems(cloud);
          return { items: cloud, cloud: true };
        }

        if (local.length > 0) {
          await saveCloudItems(local);
          return { items: local, cloud: true };
        }

        return { items: [], cloud: true };
      }
    }

    return { items: local, cloud: false };
  })().finally(() => {
    inflightLoads.delete(key);
  });

  inflightLoads.set(key, promise);
  return promise;
}

export function LeisureItemsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const sessionReady = status !== "loading";
  const signedInRef = useRef(false);

  if (status === "authenticated") signedInRef.current = true;
  if (status === "unauthenticated") signedInRef.current = false;

  const isSignedIn = status === "authenticated" || (status === "loading" && signedInRef.current);

  const [items, setItems] = useState<LeisureItem[]>([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cloudEnabled, setCloudEnabled] = useState(false);

  const itemsRef = useRef(items);
  const cloudEnabledRef = useRef(cloudEnabled);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const prevAuthRef = useRef<boolean | null>(null);
  const initialLoadDoneRef = useRef(false);

  itemsRef.current = items;
  cloudEnabledRef.current = cloudEnabled;

  const flushCloudSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!cloudEnabledRef.current) return;

    if (saveInFlightRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    saveInFlightRef.current = true;
    setSyncing(true);
    try {
      await saveCloudItems(itemsRef.current);
    } finally {
      saveInFlightRef.current = false;
      setSyncing(false);
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        await flushCloudSave();
      }
    }
  }, []);

  const scheduleCloudSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void flushCloudSave();
    }, SAVE_DEBOUNCE_MS);
  }, [flushCloudSave]);

  useEffect(() => {
    if (!sessionReady) return;

    const signedIn = status === "authenticated";
    const authChanged = prevAuthRef.current !== null && prevAuthRef.current !== signedIn;
    prevAuthRef.current = signedIn;

    if (initialLoadDoneRef.current && !authChanged) return;

    let cancelled = false;

    const run = async () => {
      if (authChanged) await flushCloudSave();

      const { items: loaded, cloud } = await loadItemsForAuth(signedIn);
      if (cancelled) return;
      setItems(loaded);
      setCloudEnabled(cloud);
      setReady(true);
      initialLoadDoneRef.current = true;
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [sessionReady, status, flushCloudSave]);

  useEffect(() => {
    const flush = () => {
      if (cloudEnabledRef.current) void flushCloudSave();
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [flushCloudSave]);

  const persist = useCallback(
    (next: LeisureItem[]) => {
      setItems(next);
      itemsRef.current = next;
      saveItems(next);

      if (isSignedIn && cloudEnabledRef.current) {
        scheduleCloudSave();
      }
    },
    [isSignedIn, scheduleCloudSave],
  );

  const addItem = useCallback(
    (item: Omit<LeisureItem, "id" | "createdAt" | "order">) => {
      const minOrder = itemsRef.current.reduce((min, i) => Math.min(min, i.order ?? 0), 0);
      const next: LeisureItem = {
        ...item,
        id: nanoid(),
        order: minOrder - 1,
        createdAt: new Date().toISOString(),
      };
      persist([next, ...itemsRef.current]);
      return next;
    },
    [persist],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<LeisureItem>) => {
      persist(itemsRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [persist],
  );

  const removeItem = useCallback(
    (id: string) => {
      persist(itemsRef.current.filter((item) => item.id !== id));
    },
    [persist],
  );

  const setStatus = useCallback(
    (id: string, nextStatus: LeisureStatus) => {
      updateItem(id, { status: nextStatus });
    },
    [updateItem],
  );

  const reorderItems = useCallback(
    (activeId: string, overId: string) => {
      persist(applyReorder(itemsRef.current, activeId, overId));
    },
    [persist],
  );

  const replaceAll = useCallback(
    (next: LeisureItem[]) => {
      persist(next);
    },
    [persist],
  );

  const value: LeisureItemsContextValue = {
    items,
    ready,
    syncing,
    cloudEnabled,
    isSignedIn,
    sessionReady,
    addItem,
    updateItem,
    removeItem,
    setStatus,
    reorderItems,
    replaceAll,
  };

  return <LeisureItemsContext.Provider value={value}>{children}</LeisureItemsContext.Provider>;
}

export function useLeisureItems(): LeisureItemsContextValue {
  const ctx = useContext(LeisureItemsContext);
  if (!ctx) {
    throw new Error("useLeisureItems must be used within LeisureItemsProvider");
  }
  return ctx;
}
