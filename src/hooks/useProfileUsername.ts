"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchProfile } from "@/lib/profile-client";

export function useProfileUsername(): string | null {
  const { status } = useSession();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setUsername(null);
      return;
    }

    let cancelled = false;
    void fetchProfile().then((profile) => {
      if (!cancelled) setUsername(profile?.username ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [status]);

  return username;
}
