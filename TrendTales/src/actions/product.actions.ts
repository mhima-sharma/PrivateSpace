"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { productSchema, type ProductInput } from "@/lib/validations";
import { ok, fail, type ActionResult } from "@/actions/types";

function revalidate() {
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function createProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail("Validation failed", parsed.error.flatten().fieldErrors);
  const data = parsed.data;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      image: data.image || null,
      price: data.price ?? null,
      currency: data.currency,
      affiliateUrl: data.affiliateUrl,
      platform: data.platform,
      blogId: data.blogId || null,
      isFeatured: data.isFeatured,
    },
  });
  revalidate();
  return ok({ id: product.id });
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail("Validation failed", parsed.error.flatten().fieldErrors);
  const data = parsed.data;

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      image: data.image || null,
      price: data.price ?? null,
      currency: data.currency,
      affiliateUrl: data.affiliateUrl,
      platform: data.platform,
      blogId: data.blogId || null,
      isFeatured: data.isFeatured,
    },
  });
  revalidate();
  return ok({ id });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidate();
  return ok();
}
