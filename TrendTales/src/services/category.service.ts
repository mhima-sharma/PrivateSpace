import { prisma } from "@/lib/prisma";

export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { blogs: { where: { status: "PUBLISHED" } } } } },
  });
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { blogs: true } } },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getPopularCategories(limit = 6) {
  return prisma.category.findMany({
    where: { isActive: true },
    take: limit,
    orderBy: [{ order: "asc" }],
    include: { _count: { select: { blogs: { where: { status: "PUBLISHED" } } } } },
  });
}
