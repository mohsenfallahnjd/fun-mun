"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Image } from "@/components/Image";
import { Loader2, LogOut, Pencil, Share2 } from "@/components/icons";
import { Link } from "@/components/Link";
import { ListBackupSection } from "@/components/ListBackupSection";
import { AppHeader } from "@/components/SiteNav";
import { ThemePicker } from "@/components/ThemePicker";
import { useTheme } from "@/components/ThemeProvider";
import { fetchProfile, patchProfile } from "@/lib/profile-client";
import { shareUserProfile } from "@/lib/share-profile";
import { loadLocalProfile, saveLocalProfile } from "@/lib/theme-storage";
import type { ThemeId } from "@/lib/themes";

interface ProfileData {
  name?: string | null;
  email?: string | null;
  username?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
  isPublic?: boolean;
  theme?: ThemeId | null;
}

export function ProfileEditPage() {
  const router = useRouter();
  const { status } = useSession();
  const { theme } = useTheme();
  const isSignedIn = status === "authenticated";

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [localName, setLocalName] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const local = loadLocalProfile();
    setLocalName(local.name ?? "");

    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    fetchProfile()
      .then((profile) => {
        if (profile) {
          const p = profile as ProfileData;
          setProfile(p);
          setName(p.name ?? "");
          setUsername(p.username ?? "");
          setBio(p.bio ?? "");
          setImageUrl(p.imageUrl ?? "");
          setIsPublic(p.isPublic ?? true);
        }
      })
      .finally(() => setLoading(false));
  }, [status]);

  const saveLocal = () => {
    saveLocalProfile({ name: localName.trim() || undefined, theme });
    setMessage("Saved on this device!");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      saveLocal();
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await patchProfile({
        name,
        username,
        bio,
        imageUrl: imageUrl.trim() || null,
        isPublic,
        theme,
      });
      const data = (await res.json()) as { error?: string; profile?: ProfileData };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      if (data.profile) {
        setProfile(data.profile);
        setUsername(data.profile.username ?? username);
      }
      saveLocalProfile({ name: name.trim() || undefined, theme });
      setMessage("Profile saved!");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    const slug = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    if (!slug) {
      setError("Set a username before sharing your profile.");
      return;
    }
    const result = await shareUserProfile({ username: slug, name: name.trim() || profile?.name });
    if (result === "copied") {
      setMessage("Link copied — spread the leisure!");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent/30 focus:ring-2";

  const slugPreview = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const displayName = isSignedIn ? name || profile?.email : localName;
  const previewInitial = (displayName || "?").charAt(0).toUpperCase();

  if (status === "loading" || (isSignedIn && loading)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header>
        <AppHeader />
        <div className="mt-6 flex items-center gap-2 text-accent">
          <Pencil className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Your profile</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {isSignedIn ? "Edit profile" : "Set up your profile"}
        </h1>
        <p className="mt-1 text-muted">
          {isSignedIn
            ? "Customize how you appear and pick your theme."
            : "Choose a theme and display name. Sign in to sync to the cloud."}
        </p>
      </header>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted/40">
          {isSignedIn && imageUrl ? (
            <Image src={imageUrl} alt="" fill className="object-cover" sizes="64px" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-accent">
              {previewInitial}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{displayName || "Your name"}</p>
          {isSignedIn && slugPreview ? (
            <p className="truncate text-sm text-muted">@{slugPreview}</p>
          ) : (
            <p className="truncate text-sm text-muted">
              {isSignedIn ? "Set a username" : "Guest · this device only"}
            </p>
          )}
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Theme color</h2>
        <p className="mt-1 mb-4 text-sm text-muted">Pick an accent color for the whole app.</p>
        <ThemePicker />
      </section>

      <form onSubmit={save} className="space-y-4 rounded-3xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          {isSignedIn ? "Profile details" : "Display name"}
        </h2>

        {!isSignedIn && (
          <>
            <div>
              <label htmlFor="local-name" className="mb-1 block text-sm font-medium">
                Display name (this device)
              </label>
              <input
                id="local-name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="How you want to be called"
                className={inputClass}
              />
            </div>
            <p className="rounded-xl bg-muted/30 px-3 py-2 text-sm text-muted">
              <Link href="/sign-in" className="font-medium">
                Sign in
              </Link>{" "}
              to set a username, bio, avatar, and sync your list to the cloud.
            </p>
          </>
        )}

        {isSignedIn && (
          <>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Display name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How others see you"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                autoComplete="username"
                className={inputClass}
              />
              {slugPreview && (
                <p className="mt-1 text-xs text-muted">
                  Profile URL:{" "}
                  <Link href={`/u/${slugPreview}`} className="font-medium">
                    /u/{slugPreview}
                  </Link>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="mb-1 block text-sm font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="A short intro about your taste in books, games, shows…"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label htmlFor="avatar" className="mb-1 block text-sm font-medium">
                Avatar URL (optional)
              </label>
              <input
                id="avatar"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                value={profile?.email ?? ""}
                disabled
                className={`${inputClass} opacity-60`}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mt-0.5 rounded border-border accent-accent"
              />
              <span>
                <span className="font-medium">Public profile</span>
                <span className="mt-0.5 block text-muted">
                  Others can find, follow, and view your leisure list.
                </span>
              </span>
            </label>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-accent">{message}</p>}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving…" : isSignedIn ? "Save profile" : "Save on this device"}
          </button>
          {isSignedIn && slugPreview && (
            <>
              <Link
                href={`/u/${slugPreview}`}
                className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium no-underline hover:bg-muted/40"
              >
                View public page
              </Link>
              <button
                type="button"
                onClick={share}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted/40"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </>
          )}
        </div>
      </form>

      <ListBackupSection />

      {isSignedIn && (
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-muted/40 sm:w-auto"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      )}
    </div>
  );
}
