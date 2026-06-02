import { handler } from "@/lib/api";
import { getSessionUser, HttpError } from "@/lib/auth-guard";
import { verifyImageSignature } from "@/lib/signed-url";
import { getObject } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { audit, auditCtxFromRequest } from "@/lib/audit";

/**
 * Private delivery for an event's image. Same gate as /api/images/[id]:
 *   1. valid authenticated session, 2. valid + unexpired signature,
 *   3. the event exists and actually has a stored image.
 */
export const GET = handler(async (req, ctx) => {
  const { id } = await ctx.params;
  if (!id) throw new HttpError(400, "Missing image id");

  const user = await getSessionUser();
  if (!user) {
    await audit({
      action: "image.access_denied",
      targetType: "event",
      targetId: id,
      metadata: { reason: "no_session" },
      ctx: auditCtxFromRequest(req),
    });
    throw new HttpError(401, "Authentication required");
  }

  const url = new URL(req.url);
  const check = verifyImageSignature(
    id,
    url.searchParams.get("exp"),
    url.searchParams.get("sig"),
  );
  if (!check.valid) throw new HttpError(403, "Invalid or expired image URL");

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || !event.storageKey || !event.mimeType)
    throw new HttpError(404, "Not found");

  const bytes = await getObject(event.storageKey);

  return new Response(bytes as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": event.mimeType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, max-age=60, must-revalidate",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
