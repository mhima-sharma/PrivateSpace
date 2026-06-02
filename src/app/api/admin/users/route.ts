import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// List all users with activity counts.
export const GET = handler(async () => {
  await requireAdmin();
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
  return Response.json({ users });
});
