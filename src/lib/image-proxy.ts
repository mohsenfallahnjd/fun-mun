const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "169.254.169.254"]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/** Block SSRF targets while allowing public HTTPS image URLs (media CDNs, user avatars, etc.). */
export function isSafeRemoteImageUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || BLOCKED_HOSTS.has(hostname)) return false;
  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) return false;

  if (hostname.includes(":")) {
    // IPv6 — block loopback and link-local
    if (hostname === "::1" || hostname.startsWith("fe80:") || hostname.startsWith("fc")) {
      return false;
    }
  }

  if (isPrivateIpv4(hostname)) return false;

  return true;
}

/** Rewrite external HTTPS image URLs to load via our server proxy. */
export function proxiedImageSrc(src: string): string {
  if (!src.startsWith("https://")) return src;
  if (!isSafeRemoteImageUrl(src)) return src;
  return `/api/image?url=${encodeURIComponent(src)}`;
}

export { MAX_IMAGE_BYTES };
