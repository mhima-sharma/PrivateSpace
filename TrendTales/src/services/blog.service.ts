import { prisma } from "@/lib/prisma";
import type { BlogStatus, Prisma } from "@prisma/client";
import { BLOGS_PER_PAGE } from "@/lib/constants";

const publicBlogSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  tags: true,
  readingTime: true,
  views: true,
  isFeatured: true,
  isTrending: true,
  publishedAt: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true, image: true } },
} satisfies Prisma.BlogSelect;

export type BlogCard = Prisma.BlogGetPayload<{ select: typeof publicBlogSelect }>;

interface ListBlogsParams {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  query?: string;
  sort?: "latest" | "popular";
  status?: BlogStatus;
}

export async function listPublishedBlogs(params: ListBlogsParams = {}) {
  const {
    page = 1,
    perPage = BLOGS_PER_PAGE,
    categorySlug,
    query,
    sort = "latest",
  } = params;

  const where: Prisma.BlogWhereInput = {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { excerpt: { contains: query } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      select: publicBlogSelect,
      orderBy:
        sort === "popular"
          ? { views: "desc" }
          : [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.blog.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getFeaturedBlogs(limit = 5) {
  return prisma.blog.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    select: publicBlogSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getTrendingBlogs(limit = 6) {
  return prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    select: publicBlogSelect,
    orderBy: [{ isTrending: "desc" }, { views: "desc" }],
    take: limit,
  });
}

export async function getLatestBlogs(limit = 6) {
  return prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    select: publicBlogSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getBlogBySlug(slug: string) {
  return prisma.blog.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      author: { select: { id: true, name: true, image: true } },
      destination: true,
      products: { orderBy: { createdAt: "asc" } },
      comments: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getRelatedBlogs(
  blogId: string,
  categoryId: string,
  limit = 3
) {
  return prisma.blog.findMany({
    where: { status: "PUBLISHED", categoryId, NOT: { id: blogId } },
    select: publicBlogSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getAllPublishedSlugs() {
  return prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });
}

/** Increment view count (fire-and-forget friendly). */
export async function incrementBlogViews(slug: string) {
  await prisma.blog.updateMany({
    where: { slug, status: "PUBLISHED" },
    data: { views: { increment: 1 } },
  });
}
