"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMyInvites } from "@/lib/invites-client";
import { cn } from "@/lib/utils";

/**
 * Small count bubble for the "Invites" nav item. Polls the same query as the
 * invites list (deduped by React Query), and renders nothing when there are no
 * pending invitations.
 */
export function InviteBadge({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ["invites", "mine"],
    queryFn: fetchMyInvites,
    refetchInterval: 60_000,
  });
  const count = data?.invites.length ?? 0;
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
