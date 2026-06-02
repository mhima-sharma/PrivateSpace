"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Images, Grid3x3 } from "lucide-react";
import { fetchPhotos, type PhotoScope } from "@/lib/memories-client";
import { PhotoCard } from "@/components/memories/photo-card";
import { PhotoTile } from "@/components/memories/photo-tile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/utils";

type Layout = "feed" | "grid";

const COPY: Record<PhotoScope, { empty: string }> = {
  all: { empty: "No photos yet — create the first post." },
  others: { empty: "No posts from others yet. Check back soon!" },
  mine: {
    empty: "You haven't posted anything yet — tap “Create post” to share one.",
  },
};

export function MemoriesFeed({
  scope = "all",
  layout = "feed",
  profile,
  userId,
  emptyText,
}: {
  scope?: PhotoScope;
  layout?: Layout;
  /** When set (My posts), renders an Instagram-style profile header. */
  profile?: { email: string };
  /** When set, shows only this member's posts (used by the profile page). */
  userId?: string;
  /** Overrides the default empty-state copy. */
  emptyText?: string;
}) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["photos", scope, userId ?? null],
      queryFn: ({ pageParam }) => fetchPhotos(pageParam, scope, userId),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor,
    });

  const photos = data?.pages.flatMap((p) => p.photos) ?? [];
  const username = profile?.email.split("@")[0] ?? "";
  const countLabel = `${photos.length}${hasNextPage ? "+" : ""}`;

  const profileHeader = profile && (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-5 sm:gap-10">
        <span className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-amber-500 via-primary to-pink-500 p-[3px] sm:size-24">
          <span className="grid size-full place-items-center rounded-full bg-card text-xl font-semibold text-foreground">
            {initials(profile.email)}
          </span>
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold">{username}</p>
          <div className="flex gap-6 text-sm">
            <span>
              <b className="font-semibold">{countLabel}</b>{" "}
              <span className="text-muted-foreground">posts</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 border-t border-border/70 pt-3 text-xs font-medium uppercase tracking-wider text-foreground">
        <Grid3x3 className="size-3.5" /> Posts
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {profileHeader}
        {layout === "grid" ? (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[470px] flex-col gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <PhotoCardSkeleton key={i} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {profileHeader}
        <div className="mx-auto grid max-w-sm place-items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <Images className="size-8 text-primary/50" />
          <p className="max-w-xs text-sm">{emptyText ?? COPY[scope].empty}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {profileHeader}

      {layout === "grid" ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {photos.map((photo) => (
            <PhotoTile key={photo.id} photo={photo} />
          ))}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[470px] flex-col gap-6">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage && <Loader2 className="animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

/** Placeholder mirroring a PhotoCard's shape while the feed loads. */
function PhotoCardSkeleton() {
  return (
    <div className="overflow-hidden border-b border-border/70 bg-card sm:rounded-2xl sm:border">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}
