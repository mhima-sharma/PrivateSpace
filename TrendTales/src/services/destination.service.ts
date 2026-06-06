import { prisma } from "@/lib/prisma";

export async function getFeaturedDestinations(limit = 6) {
  return prisma.travelDestination.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAllDestinations() {
  return prisma.travelDestination.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { blogs: true } } },
  });
}

export async function getDestinationBySlug(slug: string) {
  return prisma.travelDestination.findUnique({
    where: { slug },
    include: {
      blogs: {
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, slug: true, featuredImage: true },
      },
    },
  });
}

export async function getDestinationById(id: string) {
  return prisma.travelDestination.findUnique({ where: { id } });
}
