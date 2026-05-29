"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import type { ItemDraft } from "@/components/ItemForm";
import { ItemForm } from "@/components/ItemForm";
import { Bookmark, Download, Plus, Upload } from "@/components/icons";
import { LeisureCard } from "@/components/LeisureCard";
import { ProfileBar } from "@/components/ProfileBar";
import { SortBar } from "@/components/SortBar";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import { loadSortMode, type SortMode, saveSortMode, sortItems } from "@/lib/sort";
import { exportItems, importItems } from "@/lib/storage";
import type { LeisureItem, LeisureType } from "@/lib/types";

export function LeisureApp() {
  const {
    items,
    ready,
    syncing,
    cloudEnabled,
    isSignedIn,
    addItem,
    updateItem,
    removeItem,
    setStatus,
    reorderItems,
    replaceAll,
  } = useLeisureItems();
  const [filter, setFilter] = useState<LeisureType | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<LeisureItem | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    const c: Record<LeisureType | "all", number> = {
      all: items.length,
      book: 0,
      audiobook: 0,
      podcast: 0,
      movie: 0,
      series: 0,
      place: 0,
    };
    for (const item of items) c[item.type]++;
    return c;
  }, [items]);

  const canDrag = sortMode === "manual" && filter === "all";

  const handleDrop = (overId: string) => {
    if (dragId && dragId !== overId) {
      reorderItems(dragId, overId);
    }
    setDragId(null);
    setDragOverId(null);
  };

  const handleExport = () => {
    const blob = new Blob([exportItems(items)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fun-mun-leisure.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = importItems(reader.result as string);
        replaceAll(next);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-accent">
            <Bookmark className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Fun Mun</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Leisure time</h1>
          <p className="mt-1 text-muted">
            Books, shows, podcasts & places — bookmarked for when you need a break.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
          <ProfileBar />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              title="Export backup"
              className="rounded-xl border border-border p-2.5 text-muted transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Import backup"
              className="rounded-xl border border-border p-2.5 text-muted transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </header>

      {isSignedIn && cloudEnabled && (
        <p className="-mt-4 text-xs text-muted">
          {syncing ? "Saving to your profile…" : "Synced to your profile"}
        </p>
      )}

      {!isSignedIn && (
        <p className="-mt-4 rounded-xl border border-border bg-surface/80 px-4 py-2 text-sm text-muted">
          Sign in to save your list to the cloud. Guest data stays in this browser only.
        </p>
      )}

      <SuggestionPanel
        items={items}
        filterType={filter}
        onStart={(id) => setStatus(id, "active")}
      />

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterBar active={filter} onChange={setFilter} counts={counts} />
          <SortBar value={sortMode} onChange={handleSortChange} manualHint={canDrag} />
        </div>

        {sortMode === "manual" && filter !== "all" && (
          <p className="mt-2 text-xs text-muted">
            Switch to <strong>All</strong> to drag and reorder items.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
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
                isDragOver={dragOverId === item.id && dragId !== item.id}
                onStatusChange={setStatus}
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

      {showAdd && <ItemForm mode="add" onSave={handleSave} onClose={() => setShowAdd(false)} />}

      {editingItem && (
        <ItemForm
          mode="edit"
          initialItem={editingItem}
          onSave={handleSave}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
