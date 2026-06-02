import { env } from "@/lib/env";
import { HttpError } from "@/lib/auth-guard";
import { ZodError } from "zod";

/**
 * Same-origin (CSRF) check for state-changing requests.
 *
 * Our session cookie is SameSite=Lax, which already blocks the classic
 * cross-site form POST. As defence in depth we additionally require that the
 * Origin (or Referer) header matches our own origin for any mutating method.
 */
export function assertSameOrigin(req: Request) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const allowed = new Set(
    [env.NEXTAUTH_URL, env.WEBAUTHN_RP_ORIGIN]
      .filter(Boolean)
      .map((u) => safeOrigin(u!))
      .filter(Boolean) as string[],
  );

  // Also trust the host the browser actually connected to. Behind a proxy
  // (e.g. Vercel) the real scheme/host arrive via x-forwarded-* headers. This
  // is the canonical same-origin check (Origin must equal the requested host)
  // and keeps uploads working on any deploy URL without env juggling.
  const fwdHost = req.headers.get("x-forwarded-host");
  const host = fwdHost ?? req.headers.get("host");
  if (host) {
    const proto =
      req.headers.get("x-forwarded-proto") ??
      (origin ? safeScheme(origin) : null) ??
      "https";
    allowed.add(`${proto}://${host}`);
  }

  const candidate = origin ?? (referer ? safeOrigin(referer) : null);
  if (!candidate || !allowed.has(candidate)) {
    throw new HttpError(403, "Cross-origin request blocked");
  }
}

function safeScheme(url: string): string | null {
  try {
    return new URL(url).protocol.replace(/:$/, "");
  } catch {
    return null;
  }
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Wrap an API handler so thrown HttpError/ZodError become clean JSON responses
 * and unexpected errors become a generic 500 (never leaking internals).
 */
export function handler(
  fn: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>,
) {
  return async (
    req: Request,
    ctx: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return Response.json(
          { error: "Validation failed", details: err.flatten().fieldErrors },
          { status: 422 },
        );
      }
      console.error("[api] unhandled error", err);
      return Response.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
