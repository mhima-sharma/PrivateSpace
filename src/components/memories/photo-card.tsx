"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  type PhotoDTO,
  toggleLike,
  deletePhoto,
  fetchComments,
  addComment,
  deleteComment,
} from "@/lib/memories-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, timeAgo, initials } from "@/lib/utils";

function displayName(u: PhotoDTO["uploader"]) {
  return u.name ?? u.email.split("@")[0] ?? u.email;
}

export function PhotoCard({ photo }: { photo: PhotoDTO }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = React.useState(false);
  const [burst, setBurst] = React.useState(false); // double-tap heart animation

  const like = useMutation({
    mutationFn: () => toggleLike(photo.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });

  const remove = useMutation({
    mutationFn: () => deletePhoto(photo.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });

  function doubleTapLike() {
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    if (!photo.likedByMe) like.mutate();
  }

  const name = displayName(photo.uploader);

  return (
    <article className="overflow-hidden border-b border-border/70 bg-card transition-shadow duration-200 sm:rounded-2xl sm:border sm:shadow-sm sm:hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <Link
          href={`/u/${photo.uploader.id}`}
          className="flex items-center gap-2.5 rounded-full transition-opacity hover:opacity-80"
        >
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-tr from-amber-500 via-primary to-pink-500 p-[2px]">
            <span className="grid size-full place-items-center rounded-full bg-card text-[11px] font-semibold text-foreground">
              {initials(name)}
            </span>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold hover:underline">{name}</p>
            {photo.isHidden && (
              <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                Hidden
              </span>
            )}
          </div>
        </Link>
        {photo.canDelete ? (
          <button
            aria-label="Delete post"
            onClick={() => {
              if (confirm("Delete this post? This cannot be undone."))
                remove.mutate();
            }}
            disabled={remove.isPending}
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
          >
            {remove.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        ) : (
          <MoreHorizontal className="size-5 text-muted-foreground" />
        )}
      </div>

      {/* Image — double-click to like (served via signed, auth-gated route) */}
      <div
        className="relative aspect-square w-full select-none bg-muted"
        onDoubleClick={doubleTapLike}
      >
        <Image
          src={photo.imageUrl}
          alt={photo.caption ?? "Photo"}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 470px"
          className="object-cover"
        />
        {burst && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <Heart className="size-24 animate-fade-up fill-white text-white drop-shadow-lg" />
          </span>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 px-3 pt-3">
        <button
          aria-label="Like"
          onClick={() => like.mutate()}
          disabled={like.isPending}
          className="transition-transform active:scale-90"
        >
          <Heart
            className={cn(
              "size-6 transition-colors",
              photo.likedByMe
                ? "fill-red-500 text-red-500"
                : "text-foreground hover:text-muted-foreground",
            )}
          />
        </button>
        <button
          aria-label="Comment"
          onClick={() => setShowComments((v) => !v)}
          className="transition-transform active:scale-90"
        >
          <MessageCircle className="size-6 -scale-x-100 text-foreground hover:text-muted-foreground" />
        </button>
      </div>

      {/* Likes */}
      {photo.likeCount > 0 && (
        <p className="px-3 pt-2 text-sm font-semibold">
          {photo.likeCount} {photo.likeCount === 1 ? "like" : "likes"}
        </p>
      )}

      {/* Caption */}
      {photo.caption && (
        <p className="px-3 pt-1 text-sm">
          <span className="font-semibold">{name}</span> {photo.caption}
        </p>
      )}

      {/* View comments */}
      {photo.commentCount > 0 && !showComments && (
        <button
          onClick={() => setShowComments(true)}
          className="px-3 pt-1 text-sm text-muted-foreground hover:underline"
        >
          View all {photo.commentCount}{" "}
          {photo.commentCount === 1 ? "comment" : "comments"}
        </button>
      )}

      {/* Timestamp */}
      <p className="px-3 pb-3 pt-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {timeAgo(photo.createdAt)}
      </p>

      {showComments && <CommentThread photoId={photo.id} />}
    </article>
  );
}

function CommentThread({ photoId }: { photoId: string }) {
  const qc = useQueryClient();
  const [message, setMessage] = React.useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["comments", photoId],
    queryFn: () => fetchComments(photoId),
  });

  const add = useMutation({
    mutationFn: () => addComment(photoId, message.trim()),
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["comments", photoId] });
      qc.invalidateQueries({ queryKey: ["photos"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", photoId] });
      qc.invalidateQueries({ queryKey: ["photos"] });
    },
  });

  return (
    <div className="border-t border-border/70 px-4 py-3">
      {isLoading ? (
        <p className="py-2 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {data?.comments.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Be the first to comment.
            </li>
          )}
          {data?.comments.map((c) => (
            <li key={c.id} className="group flex items-start justify-between gap-2 text-sm">
              <p>
                <span className="font-medium">
                  {c.author.name ?? c.author.email.split("@")[0]}
                </span>{" "}
                <span className="text-foreground/90">{c.message}</span>
              </p>
              {c.canDelete && (
                <button
                  onClick={() => del.mutate(c.id)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete comment"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (message.trim()) add.mutate();
        }}
      >
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a comment…"
          maxLength={1000}
          className="h-9"
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={add.isPending || !message.trim()}
        >
          {add.isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}
