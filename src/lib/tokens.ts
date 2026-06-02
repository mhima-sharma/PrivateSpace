import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Invite token handling.
 *
 * We hand the recipient a high-entropy RAW token in their invite link, but we
 * only ever store its SHA-256 hash in the database. This means a database leak
 * never exposes usable invite links (the same principle as not storing
 * plaintext passwords).
 */

export function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Constant-time comparison of two hex-encoded hashes. */
export function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
