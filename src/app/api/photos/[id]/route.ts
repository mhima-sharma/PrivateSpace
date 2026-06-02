import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { deleteObject } from "@/lib/storage";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// Delete a photo. Allowed for the owner OR an admin (admin can delete any).
export const DELETE = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) throw new HttpError(404, "Not found");

  const isOwner = photo.uploadedBy === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

  // Remove dependent rows first (relationMode=prisma => no cascade in DB).
  await prisma.$transaction([
    prisma.like.deleteMany({ where: { photoId: id } }),
    prisma.comment.deleteMany({ where: { photoId: id } }),
    prisma.photo.delete({ where: { id } }),
  ]);

  await deleteObject(photo.storageKey).catch(() => {});

  await audit({
    userId: user.id,
    action: isAdmin && !isOwner ? "admin.photo_moderate" : "photo.delete",
    targetType: "photo",
    targetId: id,
    metadata: { owner: photo.uploadedBy },
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ ok: true });
});
