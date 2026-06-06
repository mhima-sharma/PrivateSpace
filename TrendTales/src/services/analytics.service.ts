import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, format } from "date-fns";

export async function getDashboardStats() {
  const [totalBlogs, totalCategories, totalProducts, totalClicks, viewsAgg, totalSubscribers] =
    await Promise.all([
      prisma.blog.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.affiliateClick.count(),
      prisma.blog.aggregate({ _sum: { views: true } }),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    ]);

  return {
    totalBlogs,
    totalCategories,
    totalProducts,
    totalClicks,
    totalViews: viewsAgg._sum.views ?? 0,
    totalSubscribers,
  };
}

export async function getMostViewedBlogs(limit = 5) {
  return prisma.blog.findMany({
    orderBy: { views: "desc" },
    take: limit,
    select: { id: true, title: true, slug: true, views: true, status: true },
  });
}

export async function getTopClickedProducts(limit = 5) {
  return prisma.product.findMany({
    orderBy: { clicks: "desc" },
    take: limit,
    select: { id: true, name: true, clicks: true, platform: true },
  });
}

/**
 * Monthly affiliate clicks for the last `months` months.
 * Blog views aren't timestamped per-view, so the views series approximates
 * from blogs published per month × their view totals.
 */
export async function getMonthlyAnalytics(months = 6) {
  const now = new Date();
  const start = startOfMonth(subMonths(now, months - 1));

  const [clicks, blogs] = await Promise.all([
    prisma.affiliateClick.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.blog.findMany({
      where: { publishedAt: { gte: start } },
      select: { publishedAt: true, views: true },
    }),
  ]);

  const buckets: { month: string; key: string; clicks: number; views: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = startOfMonth(subMonths(now, i));
    buckets.push({ month: format(d, "MMM"), key: format(d, "yyyy-MM"), clicks: 0, views: 0 });
  }
  const find = (date: Date) => buckets.find((b) => b.key === format(date, "yyyy-MM"));

  for (const c of clicks) {
    const bucket = find(c.createdAt);
    if (bucket) bucket.clicks += 1;
  }
  for (const b of blogs) {
    if (!b.publishedAt) continue;
    const bucket = find(b.publishedAt);
    if (bucket) bucket.views += b.views;
  }

  return buckets.map(({ month, clicks, views }) => ({ month, clicks, views }));
}
