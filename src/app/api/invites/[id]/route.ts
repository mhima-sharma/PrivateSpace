import { z } from "zod";
import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { audit, auditCtxFromRequest } from "@/lib/audit";

const actionSchema = z.object({ action: z.enum(["accept", "reject"]) });

/**
 * Accept or reject an in-app invitation. Only the invited person (matched by
 * email) may act on it, and only while it is still pending. Accepting marks the
 * invite `used` — which is what links the two accounts in the visibility graph
 * (see visibleAuthorIds). Rejecting stamps `rejectedAt` so it disappears and
 * never grants access.
 */
export const POST = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);
  const { action } = actionSchema.parse(await req.json().catch(() => null));

  const invite = await prisma.invite.findUnique({ where: { id } });
  if (!invite) throw new HttpError(404, "Invitation not found");

  // Only the invited person may act on it.
  if (invite.email.toLowerCase() !== user.email.toLowerCase())
    throw new HttpError(403, "This invitation is not for you");

  if (invite.used || invite.rejectedAt)
    throw new HttpError(409, "This invitation has already been handled.");
  if (invite.expiresAt.getTime() < Date.now())
    throw new HttpError(410, "This invitation has expired.");

  if (action === "accept") {
    await prisma.invite.update({
      where: { id },
      data: { used: true, usedAt: new Date() },
    });
  } else {
    await prisma.invite.update({
      where: { id },
      data: { rejectedAt: new Date() },
    });
  }

  await audit({
    userId: user.id,
    action: action === "accept" ? "invite.accept" : "invite.reject",
    targetType: "invite",
    targetId: id,
    metadata: { email: user.email },
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ ok: true });
});
