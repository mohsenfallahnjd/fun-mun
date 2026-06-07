"use client";

import { useState } from "react";
import { Bell, BellOff, BellRing, Calendar, Loader2 } from "@/components/icons";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import type { LeisureItem } from "@/lib/types";

interface Props {
  item: LeisureItem;
}

export function ReleaseReminderButton({ item }: Props) {
  const { updateItem } = useLeisureItems();
  const [open, setOpen] = useState(false);
  const [dateInput, setDateInput] = useState(item.releaseDate ?? "");
  const [saving, setSaving] = useState(false);
  const [pushPrompt, setPushPrompt] = useState(false);

  const isEnabled = Boolean(item.releaseReminderEnabled);

  async function ensurePushPermission(): Promise<boolean> {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") {
      setPushPrompt(true);
      return false;
    }

    // Register SW if needed
    await navigator.serviceWorker.register("/sw.js").catch(() => {});

    try {
      const keyRes = await fetch("/api/push/vapid-key");
      const { publicKey, configured } = (await keyRes.json()) as {
        publicKey?: string;
        configured?: boolean;
      };

      if (!configured || !publicKey) return false;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushPrompt(true);
        return false;
      }

      function urlBase64ToUint8Array(base64String: string) {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const raw = window.atob(base64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      return true;
    } catch {
      return false;
    }
  }

  async function save() {
    if (!dateInput) return;
    setSaving(true);
    await ensurePushPermission();
    updateItem(item.id, {
      releaseDate: dateInput,
      releaseReminderEnabled: true,
    });
    setSaving(false);
    setOpen(false);
  }

  async function remove() {
    setSaving(true);
    updateItem(item.id, {
      releaseReminderEnabled: false,
    });
    setSaving(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDateInput(item.releaseDate ?? "");
          setOpen(true);
        }}
        className={`flex w-full items-center justify-center gap-2 px-3 py-3.5 text-sm font-medium transition hover:bg-muted/30 sm:flex-row ${
          isEnabled ? "text-accent" : "text-foreground"
        }`}
      >
        {isEnabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4 text-muted" />}
        {isEnabled ? "Reminder set" : "Set reminder"}
      </button>
    );
  }

  return (
    <div className="col-span-3 flex flex-col gap-3 border-t border-border px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Release reminder</p>

      {pushPrompt && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Notifications blocked. Allow them in browser settings to receive push alerts.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="release-date" className="mb-1 block text-xs font-medium text-muted">
            Release date
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="release-date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || !dateInput}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Remind me
          </button>

          {isEnabled && (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-muted/40 disabled:opacity-50"
            >
              <BellOff className="h-4 w-4" />
              Remove
            </button>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-muted/40"
          >
            Cancel
          </button>
        </div>
      </div>

      {isEnabled && item.releaseDate && (
        <p className="text-xs text-muted">
          Currently set for{" "}
          <span className="font-medium text-accent">
            {new Date(`${item.releaseDate}T00:00:00`).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          . You'll be notified the day before and on release day.
        </p>
      )}
    </div>
  );
}
