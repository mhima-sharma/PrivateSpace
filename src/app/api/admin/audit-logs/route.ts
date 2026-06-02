import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// Paginated activity log feed for the admin dashboard.
export const GET = handler(async (req) => {
  await requireAdmin();
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const action = url.searchParams.get("action");
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? 50), 1), 100);

  const logs = await prisma.auditLog.findMany({
    where: action ? { action } : {},
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      ip: true,
      metadata: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const hasMore = logs.length > take;
  const page = hasMore ? logs.slice(0, take) : logs;

  return Response.json({
    logs: page.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
});
