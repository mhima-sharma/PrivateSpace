"use server";

import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations";
import { ok, fail, type ActionResult } from "@/actions/types";

export async function subscribeNewsletter(email: string): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse({ email });
  if (!parsed.success) return fail("Please enter a valid email address");

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: { isActive: true },
      create: { email: parsed.data.email },
    });
    return ok();
  } catch {
    return fail("Something went wrong. Please try again.");
  }
}
