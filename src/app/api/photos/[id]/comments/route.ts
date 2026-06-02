import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema, commentSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { audit, auditCtxFromRequest } from "@/lib/audit";

const select = {
  id: true,
  message: true,
  createdAt: true,
  userId: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

// List comments for a photo (oldest first).
export const GET = handler(async (req, ctx) => {
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || (photo.isHidden && user.role !== "ADMIN"))
    throw new HttpError(404, "Not found");

  const comments = await prisma.comment.findMany({
    where: { photoId: id },
    orderBy: { createdAt: "asc" },
    select,
  });

  return Response.json({
    comments: comments.map((c) => ({
      id: c.id,
      message: c.message,
      createdAt: c.createdAt.toISOString(),
      author: c.user,
      canDelete: c.userId === user.id,
    })),
  });
});

// Add a comment.
export const POST = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);

  const rl = await rateLimit(`comment:${user.id}`, 30, 60);
  if (!rl.success) throw new HttpError(429, "Slow down a moment.");

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || (photo.isHidden && user.role !== "ADMIN"))
    throw new HttpError(404, "Not found");

  const body = await req.json().catch(() => null);
  const { message } = commentSchema.parse(body);

  const comment = await prisma.comment.create({
    data: { photoId: id, userId: user.id, message },
    select,
  });

  await audit({
    userId: user.id,
    action: "comment.create",
    targetType: "photo",
    targetId: id,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json(
    {
      comment: {
        id: comment.id,
        message: comment.message,
        createdAt: comment.createdAt.toISOString(),
        author: comment.user,
        canDelete: true,
      },
    },
    { status: 201 },
  );
});
