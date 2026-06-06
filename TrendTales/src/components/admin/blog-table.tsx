"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { BlogStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/utils";
import { deleteBlog } from "@/actions/blog.actions";

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  views: number;
  isFeatured: boolean;
  createdAt: Date;
  category: { name: string };
}

const STATUS_VARIANT: Record<BlogStatus, "success" | "secondary" | "default"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  SCHEDULED: "default",
};

export function BlogTable({ blogs }: { blogs: BlogRow[] }) {
  const [pending, startTransition] = React.useTransition();

  function onDelete(id: string) {
    if (!confirm("Delete this blog? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteBlog(id);
      if (res.ok) toast.success("Blog deleted");
      else toast.error(res.error);
    });
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blogs.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                No blogs yet. Create your first story.
              </TableCell>
            </TableRow>
          )}
          {blogs.map((b) => (
            <TableRow key={b.id} data-pending={pending ? "" : undefined}>
              <TableCell className="max-w-xs">
                <span className="line-clamp-1 font-medium">{b.title}</span>
                {b.isFeatured && <Badge variant="accent" className="mt-1">Featured</Badge>}
              </TableCell>
              <TableCell className="text-muted-foreground">{b.category.name}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
              </TableCell>
              <TableCell>{formatNumber(b.views)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(b.createdAt)}</TableCell>
              <TableCell className="text-right">
                {b.status === "PUBLISHED" && (
                  <Button asChild variant="ghost" size="icon" aria-label="View">
                    <Link href={`/blog/${b.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost" size="icon" aria-label="Edit">
                  <Link href={`/admin/blogs/${b.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(b.id)} aria-label="Delete" disabled={pending}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
