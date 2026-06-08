"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bell } from "@/components/icons";
import { Link } from "@/components/Link";

export function NotificationsBell() {
  const { status } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = (await res.json()) as {
          notifications: Array<{ read: boolean }>;
        };
        setUnread(data.notifications.filter((n) => !n.read).length);
      } catch {
        // ignore
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [status]);

  if (status !== "authenticated") return null;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface no-underline transition-colors hover:bg-muted/40"
      title="Notifications"
    >
      <Bell className="h-4 w-4 text-foreground" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[10px] font-bold text-accent-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
