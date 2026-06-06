import { prisma } from "@/lib/prisma";

export interface GlobalSearchResults {
  blogs: { id: string; title: string; slug: string; excerpt: string | null; featuredImage: string | null }[];
  products: { id: string; name: string; affiliateUrl: string; image: string | null }[];
  categories: { id: string; name: string; slug: string }[];
  destinations: { id: string; name: string; slug: string; coverImage: string | null }[];
}

export async function globalSearch(query: string): Promise<GlobalSearchResults> {
  const q = query.trim();
  if (!q) {
    return { blogs: [], products: [], categories: [], destinations: [] };
  }

  const [blogs, products, categories, destinations] = await Promise.all([
    prisma.blog.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: { contains: q } }, { excerpt: { contains: q } }],
      },
      select: { id: true, title: true, slug: true, excerpt: true, featuredImage: true },
      take: 8,
    }),
    prisma.product.findMany({
      where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
      select: { id: true, name: true, affiliateUrl: true, image: true },
      take: 6,
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: q } },
      select: { id: true, name: true, slug: true },
      take: 6,
    }),
    prisma.travelDestination.findMany({
      where: { OR: [{ name: { contains: q } }, { location: { contains: q } }] },
      select: { id: true, name: true, slug: true, coverImage: true },
      take: 6,
    }),
  ]);

  return { blogs, products, categories, destinations };
}
