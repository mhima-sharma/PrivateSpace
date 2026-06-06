"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import { ok, fail, type ActionResult } from "@/actions/types";

function revalidate() {
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/blogs");
}

export async function createCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail("Validation failed", parsed.error.flatten().fieldErrors);

  const data = parsed.data;
  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) return fail("A category with this slug already exists");

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image: data.image || null,
      isActive: data.isActive,
      order: data.order,
    },
  });
  revalidate();
  return ok({ id: category.id });
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail("Validation failed", parsed.error.flatten().fieldErrors);

  const data = parsed.data;
  const clash = await prisma.category.findFirst({
    where: { slug: data.slug, NOT: { id } },
  });
  if (clash) return fail("A category with this slug already exists");

  await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image: data.image || null,
      isActive: data.isActive,
      order: data.order,
    },
  });
  revalidate();
  return ok({ id });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const count = await prisma.blog.count({ where: { categoryId: id } });
  if (count > 0) {
    return fail(`Cannot delete: ${count} blog(s) still use this category.`);
  }
  await prisma.category.delete({ where: { id } });
  revalidate();
  return ok();
}
