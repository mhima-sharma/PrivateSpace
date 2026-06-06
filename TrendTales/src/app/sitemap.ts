import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/utils";

// Generated per-request so the build doesn't require build-time DB access.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogs, categories, destinations] = await Promise.all([
    prisma.blog.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.travelDestination.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/blogs",
    "/destinations",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  return [
    ...staticRoutes,
    ...blogs.map((b) => ({
      url: absoluteUrl(`/blog/${b.slug}`),
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...destinations.map((d) => ({
      url: absoluteUrl(`/destinations/${d.slug}`),
      lastModified: d.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
