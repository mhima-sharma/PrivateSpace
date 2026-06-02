"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Grid3x3, Loader2 } from "lucide-react";
import { fetchProfile } from "@/lib/profile-client";
import { MemoriesFeed } from "@/components/memories/feed";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/utils";

export function ProfileView({ id }: { id: string }) {
  const [editing, setEditing] = React.useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => fetchProfile(id),
  });

  if (isLoading) return <ProfileHeaderSkeleton />;

  if (isError || !data) {
    return (
      <div className="mx-auto grid max-w-sm place-items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
        <p className="text-sm">
          {error instanceof Error ? error.message : "Profile not found."}
        </p>
      </div>
    );
  }

  const { profile } = data;
  const title = profile.name ?? profile.username;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-5 sm:gap-10">
          <span className="grid size-20 shrink-0 place-items-center rounded-full ring-brand p-[3px] sm:size-28">
            <span className="grid size-full place-items-center rounded-full bg-card text-2xl font-semibold text-foreground">
              {initials(title)}
            </span>
          </span>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="truncate text-xl font-semibold">
                {profile.username}
              </h1>
              {profile.isSelf && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-lg"
                  onClick={() => setEditing(true)}
                >
                  Edit profile
                </Button>
              )}
            </div>

            <div className="flex gap-6 text-sm">
              <span>
                <b className="font-semibold">{profile.postCount}</b>{" "}
                <span className="text-muted-foreground">posts</span>
              </span>
            </div>

            {/* Name + bio (desktop placement, like Instagram) */}
            <div className="hidden flex-col gap-0.5 sm:flex">
              {profile.name && (
                <p className="text-sm font-semibold">{profile.name}</p>
              )}
              {profile.bio ? (
                <p className="whitespace-pre-line text-sm text-foreground/90">
                  {profile.bio}
                </p>
              ) : profile.isSelf ? (
                <p className="text-sm text-muted-foreground">
                  Add a bio so others know more about you.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Name + bio (mobile placement, full width under the avatar row) */}
        <div className="flex flex-col gap-0.5 sm:hidden">
          {profile.name && (
            <p className="text-sm font-semibold">{profile.name}</p>
          )}
          {profile.bio ? (
            <p className="whitespace-pre-line text-sm text-foreground/90">
              {profile.bio}
            </p>
          ) : profile.isSelf ? (
            <p className="text-sm text-muted-foreground">
              Add a bio so others know more about you.
            </p>
          ) : null}
        </div>
      </header>

      {/* Posts grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-1.5 border-t border-border/70 pt-3 text-xs font-medium uppercase tracking-wider text-foreground">
          <Grid3x3 className="size-3.5" /> Posts
        </div>
        <MemoriesFeed
          layout="grid"
          userId={id}
          emptyText={
            profile.isSelf
              ? "You haven't posted anything yet."
              : "No posts yet."
          }
        />
      </div>

      {profile.isSelf && (
        <EditProfileModal
          open={editing}
          onClose={() => setEditing(false)}
          profile={profile}
        />
      )}
    </div>
  );
}

function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-5 sm:gap-10">
        <Skeleton className="size-20 rounded-full sm:size-28" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid place-items-center py-10 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    </div>
  );
}
