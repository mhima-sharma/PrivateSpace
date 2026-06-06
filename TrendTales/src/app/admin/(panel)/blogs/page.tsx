import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { BlogTable } from "@/components/admin/blog-table";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      views: true,
      isFeatured: true,
      createdAt: true,
      category: { select: { name: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Blogs"
        description="Create and manage your stories."
        action={
          <Button asChild variant="brand">
            <Link href="/admin/blogs/new">
              <Plus className="h-4 w-4" /> New Blog
            </Link>
          </Button>
        }
      />
      <BlogTable blogs={blogs} />
    </div>
  );
}
