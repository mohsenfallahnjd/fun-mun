"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Loader2, User } from "@/components/icons";
import { Link } from "@/components/Link";
import { fetchProfile } from "@/lib/profile-client";
import { loadLocalProfile } from "@/lib/theme-storage";

function useProfileNav() {
  const { data: session, status } = useSession();
  const signedInRef = useRef(false);

  if (status === "authenticated") signedInRef.current = true;
  if (status === "unauthenticated") signedInRef.current = false;

  const isSignedIn = status === "authenticated" || (status === "loading" && signedInRef.current);
  const isLoaded = status !== "loading";
  const [displayName, setDisplayName] = useState("Profile");

  useEffect(() => {
    const local = loadLocalProfile().name;
    if (local) setDisplayName(local);

    if (!isSignedIn) return;

    fetchProfile()
      .then((profile) => {
        const name = profile?.name ?? session?.user?.name;
        if (name) setDisplayName(name);
      })
      .catch(() => {});
  }, [isSignedIn, session?.user?.name]);

  const initial = displayName.charAt(0).toUpperCase();

  return { isSignedIn, isLoaded, displayName, initial };
}

export function HeaderProfile() {
  const { isSignedIn, isLoaded, initial } = useProfileNav();

  if (!isLoaded) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Link
        href="/sign-in"
        className="shrink-0 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground no-underline hover:brightness-110 sm:text-sm"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/profile/edit"
      className="inline-flex shrink-0 items-center rounded-xl border border-border bg-surface p-1.5 no-underline transition-colors hover:bg-muted/40"
      title="Profile & settings"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
        {initial}
      </span>
    </Link>
  );
}

export function BottomNavProfile() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded, initial } = useProfileNav();
  const active =
    pathname.startsWith("/profile") || pathname === "/settings" || pathname === "/sign-in";

  if (!isLoaded) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-2 py-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
        <span className="truncate text-[11px] font-medium text-muted">Profile</span>
      </div>
    );
  }

  const href = isSignedIn ? "/profile/edit" : "/sign-in";
  const label = isSignedIn ? "Profile" : "Sign in";

  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium no-underline transition-colors ${
        active ? "text-accent" : "text-muted hover:text-foreground"
      }`}
    >
      {isSignedIn ? (
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
            active ? "bg-accent text-accent-foreground" : "bg-accent/15 text-accent"
          }`}
        >
          {initial}
        </span>
      ) : (
        <User className={`h-5 w-5 ${active ? "text-accent" : ""}`} />
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
}
