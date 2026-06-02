import { handler } from "@/lib/api";
import { requireAdmin, isPublisher } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * Users visible to the requesting admin, scoped per admin:
 *  - The super publisher sees EVERYONE.
 *  - Every other admin sees only (a) users they invited, plus (b) the admin who
 *    invited them, plus their own account.
 *
 * `canManage` is true only for users this admin invited (so they can change
 * role / active) — never for their own inviter or themselves. The super
 * publisher can manage everyone (except themselves).
 */
export const GET = handler(async () => {
  const admin = await requireAdmin();
  const isSuper = isPublisher(admin.email);
  const myEmail = admin.email.toLowerCase();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      webauthnEnabled: true,
      isActive: true,
      createdAt: true,
      _count: { select: { photos: true, comments: true } },
    },
  });

  // All invite links, in both directions we care about.
  const invites = await prisma.invite.findMany({
    select: { email: true, createdById: true },
  });

  // Emails THIS admin has invited (used or not — a pending invite still links).
  const invitedByMe = new Set(
    invites
      .filter((i) => i.createdById === admin.id)
      .map((i) => i.email.toLowerCase()),
  );
  // User ids of the admin(s) who invited THIS admin.
  const myInviterIds = new Set(
    invites
      .filter((i) => i.email.toLowerCase() === myEmail && i.createdById)
      .map((i) => i.createdById as string),
  );

  const visible = isSuper
    ? users
    : users.filter(
        (u) =>
          invitedByMe.has(u.email.toLowerCase()) ||
          myInviterIds.has(u.id) ||
          u.id === admin.id,
      );

  const withPerms = visible.map((u) => {
    const canManage =
      u.id !== admin.id &&
      (isSuper || invitedByMe.has(u.email.toLowerCase()));
    return { ...u, canManage };
  });

  return Response.json({ users: withPerms });
});
