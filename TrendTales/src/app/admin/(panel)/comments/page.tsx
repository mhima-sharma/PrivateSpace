import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { CommentManager } from "@/components/admin/comment-manager";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    include: { blog: { select: { title: true, slug: true } } },
  });

  return (
    <div>
      <PageHeader title="Comments" description="Approve or remove reader comments." />
      <CommentManager comments={comments} />
    </div>
  );
}
