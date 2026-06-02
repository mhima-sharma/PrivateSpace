import { handler } from "@/lib/api";
import { getSessionUser, HttpError } from "@/lib/auth-guard";
import { verifyImageSignature } from "@/lib/signed-url";
import { getObject } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { audit, auditCtxFromRequest } from "@/lib/audit";

/**
 * Private image delivery. An image is served ONLY when ALL hold:
 *   1. The caller has a valid authenticated session.
 *   2. The URL signature is valid and unexpired (HMAC over photoId+exp).
 *   3. The photo exists and is not hidden by moderation.
 *
 * Object storage is private; bytes only ever leave through this gate.
 */
export const GET = handler(async (req, ctx) => {
  const { id } = await ctx.params;
  if (!id) throw new HttpError(400, "Missing image id");

  // (1) Session required — defence in depth on top of middleware.
  const user = await getSessionUser();
  if (!user) {
    await audit({
      action: "image.access_denied",
      targetType: "photo",
      targetId: id,
      metadata: { reason: "no_session" },
      ctx: auditCtxFromRequest(req),
    });
    throw new HttpError(401, "Authentication required");
  }

  // (2) Signature + expiry.
  const url = new URL(req.url);
  const sig = url.searchParams.get("sig");
  const exp = url.searchParams.get("exp");
  const check = verifyImageSignature(id, exp, sig);
  if (!check.valid) throw new HttpError(403, "Invalid or expired image URL");

  // (3) Photo state.
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) throw new HttpError(404, "Not found");
  if (photo.isHidden && user.role !== "ADMIN")
    throw new HttpError(404, "Not found");

  const bytes = await getObject(photo.storageKey);

  return new Response(bytes as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(bytes.byteLength),
      // Private caches only; never shared/CDN-cached.
      "Cache-Control": "private, max-age=60, must-revalidate",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
