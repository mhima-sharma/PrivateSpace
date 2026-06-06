"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { submitComment } from "@/actions/comment.actions";

interface CommentItem {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export function CommentsSection({
  blogId,
  comments,
}: {
  blogId: string;
  comments: CommentItem[];
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [content, setContent] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await submitComment({ blogId, authorName: name, authorEmail: email, content });
      if (res.ok) {
        toast.success("Comment submitted! It will appear after approval.");
        setName("");
        setEmail("");
        setContent("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Be the first to comment.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg border p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium">{c.authorName}</span>
              <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
            </div>
            <p className="text-sm text-muted-foreground">{c.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-6">
        <h3 className="font-semibold">Leave a comment</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">Email (optional)</Label>
            <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-content">Comment</Label>
          <Textarea id="c-content" required rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Post comment
        </Button>
      </form>
    </section>
  );
}
