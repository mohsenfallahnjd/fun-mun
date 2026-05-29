"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Cloud, Loader2 } from "@/components/icons";
import { Link } from "@/components/Link";
import { clearItems, loadItems } from "@/lib/storage";

interface ProfileInfo {
  name?: string | null;
  email?: string | null;
  itemCount?: number;
}

export function ProfileBar() {
  const { isSignedIn, isLoaded } = useUser();
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [localCount, setLocalCount] = useState(0);

  useEffect(() => {
    setLocalCount(loadItems().length);
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setProfile(null);
      return;
    }

    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile) setProfile(data.profile);
      })
      .catch(() => setProfile(null));
  }, [isSignedIn]);

  const migrateLocal = async () => {
    const local = loadItems();
    if (local.length === 0) return;

    setMigrating(true);
    try {
      const res = await fetch("/api/profile/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: local }),
      });
      if (res.ok) {
        clearItems();
        setLocalCount(0);
        window.location.reload();
      }
    } finally {
      setMigrating(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium no-underline hover:bg-muted/40"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground no-underline hover:brightness-110"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{profile?.name ?? "Your profile"}</p>
          <p className="text-xs text-muted">{profile?.itemCount ?? 0} items · saved to cloud</p>
        </div>
        <UserButton />
      </div>

      {localCount > 0 && (
        <button
          type="button"
          onClick={migrateLocal}
          disabled={migrating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
        >
          {migrating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Cloud className="h-3.5 w-3.5" />
          )}
          Import {localCount} local items
        </button>
      )}
    </div>
  );
}
