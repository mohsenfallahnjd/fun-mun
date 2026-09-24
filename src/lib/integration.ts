import { timingSafeEqual } from "node:crypto";
import { getProfileByUsername } from "@/lib/profile-service";

/**
 * Token auth for trusted companion apps (e.g. the hospital companion).
 * Configure INTEGRATION_TOKEN and INTEGRATION_USERNAME on the Fun Mun deployment.
 */
export async function authorizeIntegration(request: Request) {
  const expected = process.env.INTEGRATION_TOKEN;
  const username = process.env.INTEGRATION_USERNAME;
  if (!expected || !username) return null;

  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return (await getProfileByUsername(username)) ?? null;
}
