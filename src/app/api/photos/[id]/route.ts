import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { deleteObject } from "@/lib/storage";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// Delete a photo. Allowed for the OWNER ONLY — not even admins can delete
// someone else's content (admins may still hide it via moderation).
export const DELETE = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) throw new HttpError(404, "Not found");

  if (photo.uploadedBy !== user.id)
    throw new HttpError(403, "Only the owner can delete this");

  // Remove dependent rows first (relationMode=prisma => no cascade in DB).
  await prisma.$transaction([
    prisma.like.deleteMany({ where: { photoId: id } }),
    prisma.comment.deleteMany({ where: { photoId: id } }),
    prisma.photo.delete({ where: { id } }),
  ]);

  await deleteObject(photo.storageKey).catch(() => {});

  await audit({
    userId: user.id,
    action: "photo.delete",
    targetType: "photo",
    targetId: id,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ ok: true });
});
