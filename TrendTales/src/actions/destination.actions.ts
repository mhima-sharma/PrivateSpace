"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { destinationSchema, type DestinationInput } from "@/lib/validations";
import { ok, fail, type ActionResult } from "@/actions/types";

function revalidate() {
  revalidatePath("/admin/destinations");
  revalidatePath("/");
}

export async function createDestination(
  input: DestinationInput
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = destinationSchema.safeParse(input);
  if (!parsed.success) return fail("Validation failed", parsed.error.flatten().fieldErrors);
  const data = parsed.data;

  const existing = await prisma.travelDestination.findUnique({ where: { slug: data.slug } });
  if (existing) return fail("A destination with this slug already exists");

  const dest = await prisma.travelDestination.create({
    data: {
      name: data.name,
      slug: data.slug,
      location: data.location || null,
      description: data.description || null,
      bestTimeToVisit: data.bestTimeToVisit || null,
      budget: data.budget || null,
      travelTips: data.travelTips || null,
      gallery: data.gallery,
      mapUrl: data.mapUrl || null,
      coverImage: data.coverImage || null,
      isFeatured: data.isFeatured,
    },
  });
  revalidate();
  return ok({ id: dest.id });
}

export async function updateDestination(
  id: string,
  input: DestinationInput
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = destinationSchema.safeParse(input);
  if (!parsed.success) return fail("Validation failed", parsed.error.flatten().fieldErrors);
  const data = parsed.data;

  const clash = await prisma.travelDestination.findFirst({
    where: { slug: data.slug, NOT: { id } },
  });
  if (clash) return fail("A destination with this slug already exists");

  await prisma.travelDestination.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      location: data.location || null,
      description: data.description || null,
      bestTimeToVisit: data.bestTimeToVisit || null,
      budget: data.budget || null,
      travelTips: data.travelTips || null,
      gallery: data.gallery,
      mapUrl: data.mapUrl || null,
      coverImage: data.coverImage || null,
      isFeatured: data.isFeatured,
    },
  });
  revalidate();
  return ok({ id });
}

export async function deleteDestination(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.travelDestination.delete({ where: { id } });
  revalidate();
  return ok();
}
