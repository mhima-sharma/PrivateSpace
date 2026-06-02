import { handler, assertSameOrigin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { hashToken } from "@/lib/tokens";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { audit, auditCtxFromRequest } from "@/lib/audit";
import { HttpError } from "@/lib/auth-guard";
import type { Role } from "@prisma/client";

/**
 * Account creation — step 2 of the auth flow. Strictly invite-gated:
 *  1. Validate the invite token (must exist, be unused, unexpired).
 *  2. The registering email MUST match the invited email.
 *  3. Create the user + consume the invite atomically.
 */
export const POST = handler(async (req) => {
  assertSameOrigin(req);

  const ip = clientIp(req);
  const rl = await rateLimit(`register:${ip}`, 5, 60 * 10); // 5 / 10 min
  if (!rl.success) throw new HttpError(429, "Too many attempts. Try again later.");

  const body = await req.json().catch(() => null);
  const data = registerSchema.parse(body);

  const ctx = auditCtxFromRequest(req);
  const tokenHash = hashToken(data.token);

  const createdUser = await prisma.$transaction(async (tx) => {
    const invite = await tx.invite.findUnique({ where: { token: tokenHash } });
    if (!invite || invite.used || invite.expiresAt.getTime() < Date.now()) {
      throw new HttpError(400, "This invite link is invalid or has expired.");
    }
    if (invite.email.toLowerCase() !== data.email.toLowerCase()) {
      throw new HttpError(400, "This email does not match the invitation.");
    }

    const existing = await tx.user.findUnique({ where: { email: data.email } });
    if (existing) throw new HttpError(409, "An account with this email already exists.");

    // Bootstrap admin: configured email always becomes ADMIN.
    const role: Role =
      env.BOOTSTRAP_ADMIN_EMAIL &&
      data.email.toLowerCase() === env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
        ? "ADMIN"
        : invite.role;

    const passwordHash = await hashPassword(data.password);

    const user = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role,
      },
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: { used: true, usedAt: new Date() },
    });

    return user;
  });

  await audit({
    userId: createdUser.id,
    action: "user.register",
    targetType: "user",
    targetId: createdUser.id,
    ctx,
  });
  await audit({
    userId: createdUser.id,
    action: "invite.accept",
    metadata: { email: createdUser.email },
    ctx,
  });

  return Response.json({ ok: true });
});
