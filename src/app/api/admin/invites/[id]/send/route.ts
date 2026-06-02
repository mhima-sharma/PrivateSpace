import { z } from "zod";
import { handler, assertSameOrigin } from "@/lib/api";
import { requireAdmin, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { hashToken } from "@/lib/tokens";
import { sendInviteEmail } from "@/lib/mailer";
import { audit, auditCtxFromRequest } from "@/lib/audit";

const bodySchema = z.object({ url: z.string().url() });

/**
 * Email an invite link to its recipient. The raw token only exists in the link
 * the admin received at creation time (we store just its hash), so the link is
 * supplied here and verified against the stored hash before sending — the email
 * always goes to the invite's own stored address, never an arbitrary one.
 */
export const POST = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
  const { id } = idParamSchema.parse(await ctx.params);
  const { url } = bodySchema.parse(await req.json().catch(() => null));

  const invite = await prisma.invite.findUnique({ where: { id } });
  if (!invite) throw new HttpError(404, "Invite not found");
  if (invite.used) throw new HttpError(409, "This invite was already used.");
  if (invite.expiresAt.getTime() < Date.now())
    throw new HttpError(410, "This invite has expired.");

  // Verify the supplied link actually belongs to THIS invite (token → hash).
  const raw = url.split("/invite/")[1]?.split(/[?#]/)[0] ?? "";
  if (!raw || hashToken(decodeURIComponent(raw)) !== invite.token)
    throw new HttpError(400, "That link does not match this invitation.");

  await sendInviteEmail({
    to: invite.email,
    url,
    role: invite.role,
    expiresAt: invite.expiresAt,
  });

  await audit({
    userId: admin.id,
    action: "invite.send",
    targetType: "invite",
    targetId: id,
    metadata: { email: invite.email },
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ ok: true });
});
