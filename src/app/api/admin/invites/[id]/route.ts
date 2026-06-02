import { handler, assertSameOrigin } from "@/lib/api";
import { requireAdmin, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// Revoke (delete) an unused invite.
export const DELETE = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
  const { id } = idParamSchema.parse(await ctx.params);

  const invite = await prisma.invite.findUnique({ where: { id } });
  if (!invite) throw new HttpError(404, "Not found");
  if (invite.used) throw new HttpError(409, "Invite already used");

  await prisma.invite.delete({ where: { id } });

  await audit({
    userId: admin.id,
    action: "invite.revoke",
    targetType: "invite",
    targetId: id,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ ok: true });
});
