"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { blogSchema, type BlogInput } from "@/lib/validations";
import { calculateReadingTime } from "@/lib/utils";
import { ok, fail, type ActionResult } from "@/actions/types";

function revalidate(slug?: string) {
  revalidatePath("/admin/blogs");
  revalidatePath("/blogs");
  revalidatePath("/");
  if (slug) revalidatePath(`/blog/${slug}`);
}

/** Derive publishedAt / scheduledFor from status. */
function resolveDates(input: BlogInput) {
  if (input.status === "PUBLISHED") {
    return { publishedAt: new Date(), scheduledFor: null };
  }
  if (input.status === "SCHEDULED" && input.scheduledFor) {
    const when = new Date(input.scheduledFor);
    return { publishedAt: when, scheduledFor: when };
  }
  return { publishedAt: null, scheduledFor: null };
}

export async function createBlog(input: BlogInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireAdmin();
  const parsed = blogSchema.safeParse(input);
  if (!parsed.success) return fail("Validation failed", parsed.error.flatten().fieldErrors);
  const data = parsed.data;

  const existing = await prisma.blog.findUnique({ where: { slug: data.slug } });
  if (existing) return fail("A blog with this slug already exists");

  const dates = resolveDates(data);
  const blog = await prisma.blog.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      featuredImage: data.featuredImage || null,
      categoryId: data.categoryId,
      destinationId: data.destinationId || null,
      authorId: user.id,
      tags: data.tags,
      status: data.status,
      isFeatured: data.isFeatured,
      isTrending: data.isTrending,
      readingTime: calculateReadingTime(data.content),
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      ...dates,
    },
  });
  revalidate(blog.slug);
  return ok({ id: blog.id });
}

export async function updateBlog(
  id: string,
  input: BlogInput
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = blogSchema.safeParse(input);
  if (!parsed.success) return fail("Validation failed", parsed.error.flatten().fieldErrors);
  const data = parsed.data;

  const clash = await prisma.blog.findFirst({ where: { slug: data.slug, NOT: { id } } });
  if (clash) return fail("A blog with this slug already exists");

  const dates = resolveDates(data);
  const blog = await prisma.blog.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      featuredImage: data.featuredImage || null,
      categoryId: data.categoryId,
      destinationId: data.destinationId || null,
      tags: data.tags,
      status: data.status,
      isFeatured: data.isFeatured,
      isTrending: data.isTrending,
      readingTime: calculateReadingTime(data.content),
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      ...dates,
    },
  });
  revalidate(blog.slug);
  return ok({ id });
}

export async function deleteBlog(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.blog.delete({ where: { id } });
  revalidate();
  return ok();
}

export async function toggleBlogFlag(
  id: string,
  field: "isFeatured" | "isTrending",
  value: boolean
): Promise<ActionResult> {
  await requireAdmin();
  await prisma.blog.update({ where: { id }, data: { [field]: value } });
  revalidate();
  return ok();
}
