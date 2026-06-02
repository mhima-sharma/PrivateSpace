import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// List all users with activity counts. Each row carries `canManageRole`: true
// only when the requesting admin is the one who invited that user (so only the
// inviter can promote/demote them).
export const GET = handler(async () => {
  const admin = await requireAdmin();
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

  // Map each user's email → the admin who invited them (from the used invite).
  const invites = await prisma.invite.findMany({
    where: { used: true, email: { in: users.map((u) => u.email) } },
    orderBy: { usedAt: "desc" },
    select: { email: true, createdById: true },
  });
  const inviterByEmail = new Map<string, string | null>();
  for (const inv of invites) {
    if (!inviterByEmail.has(inv.email))
      inviterByEmail.set(inv.email, inv.createdById ?? null);
  }

  const withPerms = users.map((u) => {
    const inviterId = inviterByEmail.get(u.email) ?? null;
    // No invite on record → legacy/bootstrap user; any admin may manage.
    const canManageRole = inviterId === null || inviterId === admin.id;
    return { ...u, canManageRole };
  });

  return Response.json({ users: withPerms });
});
