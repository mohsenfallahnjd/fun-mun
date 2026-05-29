"use client";

import { useUser } from "@clerk/nextjs";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import { reorderItems as applyReorder } from "@/lib/sort";
import { loadItems, saveItems } from "@/lib/storage";
import type { LeisureItem, LeisureStatus } from "@/lib/types";

async function fetchCloudItems(): Promise<LeisureItem[] | null> {
  const res = await fetch("/api/items");
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { items: LeisureItem[] };
  return data.items;
}

async function saveCloudItems(items: LeisureItem[]): Promise<boolean> {
  const res = await fetch("/api/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return res.ok;
}

export function useLeisureItems() {
  const { isSignedIn, isLoaded } = useUser();
  const [items, setItems] = useState<LeisureItem[]>([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cloudEnabled, setCloudEnabled] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const load = async () => {
      if (isSignedIn) {
        const cloud = await fetchCloudItems();
        if (cloud) {
          setItems(cloud);
          setCloudEnabled(true);
        } else {
          setItems(loadItems());
          setCloudEnabled(false);
        }
      } else {
        setItems(loadItems());
        setCloudEnabled(false);
      }
      setReady(true);
    };

    load();
  }, [isSignedIn, isLoaded]);

  const persist = useCallback(
    async (next: LeisureItem[]) => {
      setItems(next);
      if (isSignedIn && cloudEnabled) {
        setSyncing(true);
        try {
          await saveCloudItems(next);
        } finally {
          setSyncing(false);
        }
      } else {
        saveItems(next);
      }
    },
    [isSignedIn, cloudEnabled],
  );

  const addItem = useCallback(
    (item: Omit<LeisureItem, "id" | "createdAt" | "order">) => {
      const minOrder = items.reduce((min, i) => Math.min(min, i.order ?? 0), 0);
      const next: LeisureItem = {
        ...item,
        id: nanoid(),
        order: minOrder - 1,
        createdAt: new Date().toISOString(),
      };
      persist([next, ...items]);
      return next;
    },
    [items, persist],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<LeisureItem>) => {
      persist(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [items, persist],
  );

  const removeItem = useCallback(
    (id: string) => {
      persist(items.filter((item) => item.id !== id));
    },
    [items, persist],
  );

  const setStatus = useCallback(
    (id: string, status: LeisureStatus) => {
      updateItem(id, { status });
    },
    [updateItem],
  );

  const reorderItems = useCallback(
    (activeId: string, overId: string) => {
      persist(applyReorder(items, activeId, overId));
    },
    [items, persist],
  );

  const replaceAll = useCallback(
    (next: LeisureItem[]) => {
      persist(next);
    },
    [persist],
  );

  return {
    items,
    ready,
    syncing,
    cloudEnabled,
    isSignedIn: isSignedIn ?? false,
    addItem,
    updateItem,
    removeItem,
    setStatus,
    reorderItems,
    replaceAll,
  };
}
