import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";
import { audit, auditCtxFromRequest } from "@/lib/audit";
import { serializeProfile } from "@/lib/serialize";

// ── Update the signed-in user's own profile (display name + bio) ───────────
export const PATCH = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();

  const body = await req.json().catch(() => null);
  const data = profileSchema.parse(body);

  // An explicit empty string clears the field; an absent field is left as-is.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name === undefined ? undefined : data.name || null,
      bio: data.bio === undefined ? undefined : data.bio || null,
    },
    select: { id: true, name: true, email: true, bio: true },
  });

  const postCount = await prisma.photo.count({
    where: {
      uploadedBy: user.id,
      ...(user.role === "ADMIN" ? {} : { isHidden: false }),
    },
  });

  await audit({
    userId: user.id,
    action: "profile.update",
    targetType: "user",
    targetId: user.id,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ profile: serializeProfile(updated, user, postCount) });
});
