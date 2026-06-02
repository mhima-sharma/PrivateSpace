import { handler, assertSameOrigin } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createInviteSchema } from "@/lib/validation";
import { createInvite, inviteUrl } from "@/lib/invites";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// List recent invites.
export const GET = handler(async () => {
  await requireAdmin();
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      role: true,
      used: true,
      usedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });
  return Response.json({ invites });
});

// Create an invite. Returns the one-time link (shown to the admin once).
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
  const body = await req.json().catch(() => null);
  const { email, role } = createInviteSchema.parse(body);

  const { raw, id, expiresAt } = await createInvite({
    email,
    role,
    createdById: admin.id,
  });

  await audit({
    userId: admin.id,
    action: "invite.create",
    targetType: "invite",
    targetId: id,
    metadata: { email, role },
    ctx: auditCtxFromRequest(req),
  });

  return Response.json(
    { id, email, role, expiresAt, url: inviteUrl(raw) },
    { status: 201 },
  );
});
