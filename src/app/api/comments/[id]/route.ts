import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// Delete a comment — AUTHOR ONLY (not even admins can delete others').
export const DELETE = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new HttpError(404, "Not found");

  if (comment.userId !== user.id)
    throw new HttpError(403, "Only the author can delete this");

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
