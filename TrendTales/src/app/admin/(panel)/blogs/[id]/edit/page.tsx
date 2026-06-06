import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { BlogForm } from "@/components/admin/blog-form";
import type { BlogInput } from "@/lib/validations";

export const dynamic = "force-dynamic";

function asTags(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function toLocalDateTimeValue(date: Date | null): string {
  if (!date) return "";
  // Format as yyyy-MM-ddThh:mm for <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [blog, categories, destinations] = await Promise.all([
    prisma.blog.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.travelDestination.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!blog) notFound();

  const initial: Partial<BlogInput> = {
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt ?? "",
    content: blog.content,
    featuredImage: blog.featuredImage ?? "",
    categoryId: blog.categoryId,
    destinationId: blog.destinationId ?? "",
    tags: asTags(blog.tags),
    status: blog.status,
    isFeatured: blog.isFeatured,
    isTrending: blog.isTrending,
    scheduledFor: toLocalDateTimeValue(blog.scheduledFor),
    metaTitle: blog.metaTitle ?? "",
    metaDescription: blog.metaDescription ?? "",
  };

  return (
    <div>
      <PageHeader title="Edit Blog" description={blog.title} />
      <BlogForm categories={categories} destinations={destinations} blogId={blog.id} initial={initial} />
    </div>
  );
}
