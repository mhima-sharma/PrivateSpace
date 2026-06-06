"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { commentSchema, type CommentInput } from "@/lib/validations";
import { ok, fail, type ActionResult } from "@/actions/types";

/** Public: submit a comment. Comments require admin approval before display. */
export async function submitComment(input: CommentInput): Promise<ActionResult> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return fail("Validation failed", parsed.error.flatten().fieldErrors);
  const data = parsed.data;

  const blog = await prisma.blog.findUnique({ where: { id: data.blogId } });
  if (!blog) return fail("Blog not found");

  await prisma.comment.create({
    data: {
      blogId: data.blogId,
      authorName: data.authorName,
      authorEmail: data.authorEmail || null,
      content: data.content,
      isApproved: false,
    },
  });
  return ok();
}

export async function approveComment(id: string): Promise<ActionResult> {
  await requireAdmin();
  const comment = await prisma.comment.update({
    where: { id },
    data: { isApproved: true },
    include: { blog: { select: { slug: true } } },
  });
  revalidatePath(`/blog/${comment.blog.slug}`);
  revalidatePath("/admin/comments");
  return ok();
}

export async function deleteComment(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.comment.delete({ where: { id } });
  revalidatePath("/admin/comments");
  return ok();
}
