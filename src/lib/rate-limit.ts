import { env } from "@/lib/env";

/**
 * Lightweight fixed-window rate limiter.
 *
 * Default: in-memory (per serverless instance). Good enough for abuse
 * mitigation on a small private app. For strict multi-instance limits, set
 * UPSTASH_REDIS_REST_URL/TOKEN and the Redis path is used instead.
 */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms when the window resets
}

type Bucket = { count: number; reset: number };
const memory = new Map<string, Bucket>();

async function redisIncr(
  key: string,
  windowSec: number,
): Promise<number | null> {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    // Pipeline: INCR then EXPIRE NX so the window is set once.
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result: number }>;
    return data[0]?.result ?? null;
  } catch {
    return null;
  }
}

/**
 * @param identifier  Unique caller key, e.g. `login:<ip>` or `upload:<userId>`.
 * @param limit       Max requests allowed within the window.
 * @param windowSec   Window length in seconds.
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const now = Date.now();

  // Try Redis first (shared across instances).
  const redisCount = await redisIncr(identifier, windowSec);
  if (redisCount !== null) {
    return {
      success: redisCount <= limit,
      remaining: Math.max(0, limit - redisCount),
      reset: now + windowSec * 1000,
    };
  }

  // In-memory fallback.
  const existing = memory.get(identifier);
  if (!existing || existing.reset < now) {
    const reset = now + windowSec * 1000;
    memory.set(identifier, { count: 1, reset });
    return { success: true, remaining: limit - 1, reset };
  }
  existing.count += 1;
  return {
    success: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    reset: existing.reset,
  };
}

/** Resolve a best-effort client IP from request headers. */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
