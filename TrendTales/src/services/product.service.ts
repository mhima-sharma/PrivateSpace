import { prisma } from "@/lib/prisma";

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { blog: { select: { id: true, title: true, slug: true } } },
  });
}

export async function getTopProducts(limit = 5) {
  return prisma.product.findMany({
    orderBy: { clicks: "desc" },
    take: limit,
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}
