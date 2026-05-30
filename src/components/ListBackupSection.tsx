"use client";

import { useEffect, useRef, useState } from "react";
import { Cloud, Download, Loader2, Upload } from "@/components/icons";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import { normalizeItemsForSave } from "@/lib/items-mapper";
import { countUnmergedLocalItems, exportItems, importItems, loadItems } from "@/lib/storage";
import type { LeisureItem } from "@/lib/types";

export function ListBackupSection() {
  const { items, replaceAll, isSignedIn, cloudEnabled, ready } = useLeisureItems();
  const fileRef = useRef<HTMLInputElement>(null);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState("");
  const [unmergedCount, setUnmergedCount] = useState(0);

  useEffect(() => {
    if (!ready || !isSignedIn || !cloudEnabled) {
      setUnmergedCount(0);
      return;
    }
    setUnmergedCount(countUnmergedLocalItems(items));
  }, [ready, isSignedIn, cloudEnabled, items]);

  const handleExport = () => {
    const blob = new Blob([exportItems(items)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fun-mun-leisure.json";
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Backup downloaded.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = normalizeItemsForSave(importItems(reader.result as string));
        replaceAll(next);
        setMessage(`Imported ${next.length} items.`);
      } catch {
        setMessage("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const migrateLocal = async () => {
    const local = loadItems();
    const cloudIds = new Set(items.map((item) => item.id));
    const toMerge = local.filter((item) => !cloudIds.has(item.id));
    if (toMerge.length === 0) return;

    setMigrating(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toMerge }),
      });
      if (res.ok) {
        const data = (await res.json()) as { items: LeisureItem[] };
        replaceAll(data.items);
        setUnmergedCount(0);
        setMessage("Local items merged into your cloud list.");
      } else {
        setMessage("Could not merge local items.");
      }
    } finally {
      setMigrating(false);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">List backup</h2>
      <p className="mt-1 mb-4 text-sm text-muted">
        Export your leisure list as JSON or restore from a backup file.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted/40"
        >
          <Download className="h-4 w-4" />
          Export backup
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted/40"
        >
          <Upload className="h-4 w-4" />
          Import backup
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />

      {isSignedIn && cloudEnabled && unmergedCount > 0 && (
        <button
          type="button"
          onClick={migrateLocal}
          disabled={migrating}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
        >
          {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
          Merge {unmergedCount} local items into cloud
        </button>
      )}

      {message && <p className="mt-3 text-sm text-muted">{message}</p>}
    </section>
  );
}
