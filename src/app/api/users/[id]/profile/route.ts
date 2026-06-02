import { handler } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { serializeProfile } from "@/lib/serialize";

// ── Fetch a member's public profile (name, username, bio, post count) ──────
// Any signed-in member may view another member's profile. Disabled accounts
// are treated as not found (except to admins).
export const GET = handler(async (req, ctx) => {
  const viewer = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, bio: true, isActive: true },
  });

  if (!user || (!user.isActive && viewer.role !== "ADMIN")) {
    throw new HttpError(404, "Profile not found");
  }

  const postCount = await prisma.photo.count({
    where: {
      uploadedBy: user.id,
      ...(viewer.role === "ADMIN" ? {} : { isHidden: false }),
    },
  });

  return Response.json({ profile: serializeProfile(user, viewer, postCount) });
});
