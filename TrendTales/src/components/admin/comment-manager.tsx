"use client";

import * as React from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { approveComment, deleteComment } from "@/actions/comment.actions";

interface CommentRow {
  id: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  isApproved: boolean;
  createdAt: Date;
  blog: { title: string; slug: string };
}

export function CommentManager({ comments }: { comments: CommentRow[] }) {
  const [pending, startTransition] = React.useTransition();

  function approve(id: string) {
    startTransition(async () => {
      const res = await approveComment(id);
      if (res.ok) toast.success("Comment approved");
      else toast.error(res.error);
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      const res = await deleteComment(id);
      if (res.ok) toast.success("Comment deleted");
      else toast.error(res.error);
    });
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        No comments yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="rounded-xl border p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-medium">{c.authorName}</span>
            {c.authorEmail && <span className="text-sm text-muted-foreground">{c.authorEmail}</span>}
            {c.isApproved ? (
              <Badge variant="success">Approved</Badge>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
          </div>
          <p className="mb-1 text-sm">{c.content}</p>
          <p className="mb-3 text-xs text-muted-foreground">on “{c.blog.title}”</p>
          <div className="flex gap-2">
            {!c.isApproved && (
              <Button size="sm" variant="outline" onClick={() => approve(c.id)} disabled={pending}>
                <Check className="h-4 w-4" /> Approve
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => remove(c.id)} disabled={pending}>
              <Trash2 className="h-4 w-4 text-destructive" /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
