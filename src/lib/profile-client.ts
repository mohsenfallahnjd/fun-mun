export interface ProfileResponse {
  id?: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  bio?: string | null;
  isPublic?: boolean;
  imageUrl?: string | null;
  theme?: string | null;
  itemCount?: number;
}

let cachedProfile: ProfileResponse | null | undefined;
let inflightProfile: Promise<ProfileResponse | null> | null = null;

export function invalidateProfileCache(): void {
  cachedProfile = undefined;
  inflightProfile = null;
}

export async function fetchProfile(force = false): Promise<ProfileResponse | null> {
  if (!force && cachedProfile !== undefined) {
    return cachedProfile;
  }
  if (!force && inflightProfile) {
    return inflightProfile;
  }

  inflightProfile = fetch("/api/profile")
    .then(async (res) => {
      if (res.status === 401) {
        cachedProfile = null;
        return null;
      }
      if (!res.ok) {
        cachedProfile = null;
        return null;
      }
      const data = (await res.json()) as { profile?: ProfileResponse };
      cachedProfile = data.profile ?? null;
      return cachedProfile;
    })
    .catch(() => {
      cachedProfile = null;
      return null;
    })
    .finally(() => {
      inflightProfile = null;
    });

  return inflightProfile;
}

export async function patchProfile(body: Record<string, unknown>): Promise<Response> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    invalidateProfileCache();
  }
  return res;
}
