import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { BlogForm } from "@/components/admin/blog-form";

export const dynamic = "force-dynamic";

export default async function NewBlogPage() {
  const [categories, destinations] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.travelDestination.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="New Blog" description="Write and publish a new story." />
      <BlogForm categories={categories} destinations={destinations} />
    </div>
  );
}
