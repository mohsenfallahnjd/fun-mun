"use client";

import { useEffect, useMemo, useState } from "react";
import type { ItemDraft } from "@/components/ItemForm";
import { ItemForm } from "@/components/ItemForm";
import { Bookmark, Plus } from "@/components/icons";
import { LeisureCard } from "@/components/LeisureCard";
import { ListToolbar } from "@/components/ListToolbar";
import { AppHeader } from "@/components/SiteNav";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import { loadSortMode, type SortMode, saveSortMode, sortItems } from "@/lib/sort";
import { emptyTypeCounts, type LeisureItem, type LeisureType } from "@/lib/types";

export function LeisureApp() {
  const {
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
  } = useLeisureItems();
  const [filter, setFilter] = useState<LeisureType | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<LeisureItem | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    setSortMode(loadSortMode());
  }, []);

  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    saveSortMode(mode);
  };

  const sorted = useMemo(() => sortItems(items, sortMode), [items, sortMode]);

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted.filter((i) => i.type === filter);
  }, [sorted, filter]);

  const counts = useMemo(() => {
    const c = emptyTypeCounts();
    c.all = items.length;
    for (const item of items) c[item.type]++;
    return c;
  }, [items]);

  const canDrag = sortMode === "manual" && filter === "all";

  const handleDrop = (overId: string, activeId?: string) => {
    const from = activeId ?? dragId;
    if (from && from !== overId) {
      reorderItems(from, overId);
    }
    setDragId(null);
    setDragOverId(null);
  };

  const handleSave = (draft: ItemDraft) => {
    if (editingItem) {
      updateItem(editingItem.id, draft);
      setEditingItem(null);
    } else {
      addItem(draft);
      setShowAdd(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-3 sm:gap-4">
          <AppHeader />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-accent sm:mb-2">
                <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs font-semibold uppercase tracking-wider sm:text-sm">
                  Fun Mun
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Leisure time</h1>
              <p className="mt-1 hidden text-sm text-muted sm:block">
                Books, shows, games, podcasts & places — bookmarked for when you need a break.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-110 sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </header>

        {isSignedIn && cloudEnabled && (
          <p className="-mt-2 text-xs text-muted sm:-mt-4">
            {syncing ? "Saving to your profile…" : "Synced to your profile"}
          </p>
        )}

        {sessionReady && !isSignedIn && (
          <p className="-mt-2 rounded-xl border border-border bg-surface/80 px-3 py-2 text-xs text-muted sm:-mt-4 sm:px-4 sm:text-sm">
            Sign in to save your list to the cloud. Guest data stays in this browser only.
          </p>
        )}

        <SuggestionPanel
          items={items}
          filterType={filter}
          onStart={(id) => setStatus(id, "active")}
        />

        <section>
          <div className="sticky top-0 z-20 -mx-4 bg-background/70 px-4 py-2 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:p-0">
            <ListToolbar
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
              sortMode={sortMode}
              onSortChange={handleSortChange}
            />
          </div>

          {canDrag && sortMode === "manual" && (
            <p className="text-xs text-muted">
              Press and hold the <span aria-hidden>⋮⋮</span> handle, then drag to reorder.
            </p>
          )}

          {sortMode === "manual" && filter !== "all" && (
            <p className="text-xs text-muted">
              Switch to <strong>All</strong> to reorder.
            </p>
          )}

          <div className="mt-3 flex flex-col gap-3 sm:mt-4">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-12 text-center sm:py-16">
                <p className="text-muted">Nothing here yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="mt-3 text-sm font-medium text-accent hover:underline"
                >
                  Add your first item
                </button>
              </div>
            ) : (
              filtered.map((item) => (
                <LeisureCard
                  key={item.id}
                  item={item}
                  draggable={canDrag}
                  isDragging={dragId === item.id}
                  isDragOver={dragOverId === item.id && dragId !== item.id}
                  onStatusChange={setStatus}
                  onProgressAdvance={(id, progress) => updateItem(id, { progress })}
                  onEdit={setEditingItem}
                  onRemove={removeItem}
                  onDragStart={setDragId}
                  onDragOver={setDragOverId}
                  onDrop={handleDrop}
                  onDragEnd={() => {
                    setDragId(null);
                    setDragOverId(null);
                  }}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Mobile FAB — thumb-reachable add */}
      <button
        type="button"
        onClick={() => setShowAdd(true)}
        aria-label="Add item"
        className="fixed z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:brightness-110 active:scale-95 sm:hidden"
        style={{
          right: "max(1rem, env(safe-area-inset-right))",
          bottom: "calc(4.75rem + env(safe-area-inset-bottom))",
        }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {showAdd && <ItemForm mode="add" onSave={handleSave} onClose={() => setShowAdd(false)} />}

      {editingItem && (
        <ItemForm
          mode="edit"
          initialItem={editingItem}
          onSave={handleSave}
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  );
}
