"use client";

import { useState } from "react";
import { Bell, BellOff, BellRing, Calendar, Loader2 } from "@/components/icons";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import type { LeisureItem } from "@/lib/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const RELEASE_DAY_NAMES = DAY_NAMES;
export const RELEASE_DAY_FULL = DAY_FULL;

interface Props {
  item: LeisureItem;
}

export function ReleaseReminderButton({ item }: Props) {
  const { updateItem } = useLeisureItems();
  const isSeries = item.type === "series";

  const [open, setOpen] = useState(false);
  const [dateInput, setDateInput] = useState(item.releaseDate ?? "");
  const [dayInput, setDayInput] = useState<number>(item.releaseDay ?? 1);
  const [saving, setSaving] = useState(false);
  const [pushPrompt, setPushPrompt] = useState(false);

  const isEnabled = Boolean(item.releaseReminderEnabled);

  async function ensurePushPermission(): Promise<void> {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") {
      setPushPrompt(true);
      return;
    }

    await navigator.serviceWorker.register("/sw.js").catch(() => {});

    try {
      const keyRes = await fetch("/api/push/vapid-key");
      const { publicKey, configured } = (await keyRes.json()) as {
        publicKey?: string;
        configured?: boolean;
      };
      if (!configured || !publicKey) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushPrompt(true);
        return;
      }

      function urlBase64ToUint8Array(b64: string) {
        const padding = "=".repeat((4 - (b64.length % 4)) % 4);
        const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
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
    } catch {
      // best-effort
    }
  }

  async function save() {
    if (!isSeries && !dateInput) return;
    setSaving(true);
    await ensurePushPermission();
    if (isSeries) {
      updateItem(item.id, {
        releaseDay: dayInput,
        releaseDate: undefined,
        releaseReminderEnabled: true,
      });
    } else {
      updateItem(item.id, {
        releaseDate: dateInput,
        releaseDay: undefined,
        releaseReminderEnabled: true,
      });
    }
    setSaving(false);
    setOpen(false);
  }

  function remove() {
    updateItem(item.id, {
      releaseReminderEnabled: false,
      releaseDay: undefined,
      releaseDate: undefined,
    });
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDateInput(item.releaseDate ?? "");
          setDayInput(item.releaseDay ?? 1);
          setOpen(true);
        }}
        className={`flex w-full items-center justify-center gap-2 px-3 py-3.5 text-sm font-medium transition hover:bg-muted/30 sm:flex-row ${
          isEnabled ? "text-accent" : "text-foreground"
        }`}
      >
        {isEnabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4 text-muted" />}
        {isEnabled
          ? isSeries
            ? `Every ${DAY_FULL[item.releaseDay ?? 1]}`
            : "Reminder set"
          : isSeries
            ? "Set weekly reminder"
            : "Set release reminder"}
      </button>
    );
  }

  return (
    <div className="col-span-3 flex flex-col gap-3 border-t border-border px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {isSeries ? "Weekly episode reminder" : "Release reminder"}
      </p>

      {pushPrompt && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Notifications blocked. Allow them in browser settings to receive push alerts.
        </p>
      )}

      {isSeries ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">New episodes drop every…</p>
          <div className="flex flex-wrap gap-1.5">
            {DAY_FULL.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setDayInput(i)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  dayInput === i
                    ? "bg-accent text-accent-foreground"
                    : "border border-border hover:bg-muted/40"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
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
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || (!isSeries && !dateInput)}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:brightness-110 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          {isSeries ? `Remind me every ${DAY_NAMES[dayInput]}` : "Remind me"}
        </button>

        {isEnabled && (
          <button
            type="button"
            onClick={remove}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-muted/40"
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

      {isEnabled && (
        <p className="text-xs text-muted">
          {isSeries ? (
            <>
              You'll be notified every{" "}
              <span className="font-medium text-accent">
                {DAY_FULL[item.releaseDay ?? dayInput]}
              </span>{" "}
              when a new episode is due.
            </>
          ) : (
            item.releaseDate && (
              <>
                Set for{" "}
                <span className="font-medium text-accent">
                  {new Date(`${item.releaseDate}T00:00:00`).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                . You'll be notified the day before and on release day.
              </>
            )
          )}
        </p>
      )}
    </div>
  );
}
