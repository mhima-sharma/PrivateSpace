import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// Toggle a like for the current user on a photo.
export const POST = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || (photo.isHidden && user.role !== "ADMIN"))
    throw new HttpError(404, "Not found");

  const existing = await prisma.like.findUnique({
    where: { photoId_userId: { photoId: id, userId: user.id } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.like.create({ data: { photoId: id, userId: user.id } });
    liked = true;
  }

  const likeCount = await prisma.like.count({ where: { photoId: id } });

  await audit({
    userId: user.id,
    action: liked ? "photo.like" : "photo.unlike",
    targetType: "photo",
    targetId: id,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ liked, likeCount });
});
