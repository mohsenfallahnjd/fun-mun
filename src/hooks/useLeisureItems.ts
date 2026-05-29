"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import { reorderItems as applyReorder } from "@/lib/sort";
import { loadItems, saveItems } from "@/lib/storage";
import type { LeisureItem, LeisureStatus } from "@/lib/types";

export function useLeisureItems() {
  const [items, setItems] = useState<LeisureItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(loadItems());
    setReady(true);
  }, []);

  const persist = useCallback((next: LeisureItem[]) => {
    setItems(next);
    saveItems(next);
  }, []);

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
    addItem,
    updateItem,
    removeItem,
    setStatus,
    reorderItems,
    replaceAll,
  };
}
