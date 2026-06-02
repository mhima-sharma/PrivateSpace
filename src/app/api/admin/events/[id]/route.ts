import { handler, assertSameOrigin } from "@/lib/api";
import { requireAdmin, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { deleteObject } from "@/lib/storage";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// Delete an event (active or archived). Removes its image from storage too.
export const DELETE = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
  const { id } = idParamSchema.parse(await ctx.params);

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new HttpError(404, "Not found");

  // Only the admin who posted the event may delete it — no one else.
  if (event.createdById !== admin.id)
    throw new HttpError(403, "Only the admin who posted this can delete it.");

  if (event.storageKey) await deleteObject(event.storageKey).catch(() => {});
  await prisma.event.delete({ where: { id } });

  await audit({
    userId: admin.id,
    action: "event.delete",
    targetType: "event",
    targetId: id,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ ok: true });
});
