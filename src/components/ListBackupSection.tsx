"use client";

import { useEffect, useRef, useState } from "react";
import { Cloud, Download, Loader2, Upload } from "@/components/icons";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import { clearItems, exportItems, importItems, loadItems } from "@/lib/storage";

export function ListBackupSection() {
  const { items, replaceAll, isSignedIn } = useLeisureItems();
  const fileRef = useRef<HTMLInputElement>(null);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState("");
  const [localCount, setLocalCount] = useState(0);

  useEffect(() => {
    setLocalCount(loadItems().length);
  }, []);

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
        const next = importItems(reader.result as string);
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
    if (local.length === 0) return;

    setMigrating(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: local }),
      });
      if (res.ok) {
        clearItems();
        setMessage("Local items merged into your cloud list.");
        window.location.reload();
      } else {
        setMessage("Could not import local items.");
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

      {isSignedIn && localCount > 0 && (
        <button
          type="button"
          onClick={migrateLocal}
          disabled={migrating}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
        >
          {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
          Merge {localCount} local items into cloud
        </button>
      )}

      {message && <p className="mt-3 text-sm text-muted">{message}</p>}
    </section>
  );
}
