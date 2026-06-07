"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "@/components/icons";
import { Link } from "@/components/Link";
import { AppHeader } from "@/components/SiteNav";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data: { notifications?: Notification[] }) => {
        setItems(data.notifications ?? []);
        // Mark all as read
        if ((data.notifications ?? []).some((n) => !n.read)) {
          fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ all: true }),
          }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <AppHeader />

      <header className="mt-6 mb-6">
        <div className="flex items-center gap-2 text-accent">
          <Bell className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Notifications</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Your notifications</h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-8 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted/40" />
          <p className="font-medium">No notifications yet</p>
          <p className="mt-1 text-sm text-muted">
            Set release reminders on movies and series to get notified here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          {items.map((n) => {
            const content = (
              <div className="flex items-start gap-3 px-5 py-4">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-muted/60">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );

            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="block no-underline hover:bg-muted/30">
                    {content}
                  </Link>
                ) : (
                  <div>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
