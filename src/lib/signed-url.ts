import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Self-issued signed URLs for private image access.
 *
 * Images are NEVER publicly reachable. The client receives a URL of the form:
 *   /api/images/<photoId>?exp=<epochSec>&sig=<hmac>
 * The route validates: (a) the signature, (b) expiry, AND (c) the caller's
 * authenticated session — so even a leaked signed URL is useless after the TTL
 * and useless to anyone without a valid session cookie.
 */

export function signImagePath(photoId: string, ttlSec = env.IMAGE_URL_TTL_SECONDS) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = sign(`${photoId}:${exp}`);
  const params = new URLSearchParams({ exp: String(exp), sig });
  return `/api/images/${photoId}?${params.toString()}`;
}

export function verifyImageSignature(
  photoId: string,
  exp: string | null,
  sig: string | null,
): { valid: boolean; reason?: string } {
  if (!exp || !sig) return { valid: false, reason: "missing params" };
  const expNum = Number(exp);
  if (!Number.isFinite(expNum)) return { valid: false, reason: "bad exp" };
  if (expNum < Math.floor(Date.now() / 1000))
    return { valid: false, reason: "expired" };

  const expected = sign(`${photoId}:${expNum}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return { valid: false, reason: "bad signature" };

  return { valid: true };
}

function sign(payload: string): string {
  return createHmac("sha256", env.IMAGE_URL_SIGNING_SECRET)
    .update(payload)
    .digest("base64url");
}
