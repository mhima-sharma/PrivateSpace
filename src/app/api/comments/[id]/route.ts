import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// Delete a comment (author or admin).
export const DELETE = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new HttpError(404, "Not found");

  const isOwner = comment.userId === user.id;
  if (!isOwner && user.role !== "ADMIN") throw new HttpError(403, "Not allowed");

  await prisma.comment.delete({ where: { id } });

  await audit({
    userId: user.id,
    action: "comment.delete",
    targetType: "comment",
    targetId: id,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ ok: true });
});
