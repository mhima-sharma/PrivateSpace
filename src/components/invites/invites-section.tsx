"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MailPlus, Check, X, Loader2, ShieldCheck, Inbox } from "lucide-react";
import {
  fetchMyInvites,
  respondToInvite,
  type PendingInviteDTO,
} from "@/lib/invites-client";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

function inviterName(inv: PendingInviteDTO): string {
  const i = inv.inviter;
  if (!i) return "Someone";
  return i.name ?? i.email.split("@")[0] ?? i.email;
}

function usePendingInvites() {
  return useQuery({
    queryKey: ["invites", "mine"],
    queryFn: fetchMyInvites,
    refetchInterval: 60_000,
  });
}

/**
 * Compact dashboard card. Hides itself when there are no pending invites so it
 * never clutters the feed. The full list lives on the /invites tab.
 */
export function InvitesSection() {
  const { data } = usePendingInvites();
  const invites = data?.invites ?? [];
  if (invites.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <MailPlus className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">
          {invites.length === 1
            ? "You have an invitation"
            : `You have ${invites.length} invitations`}
        </h2>
      </div>
      <ul className="flex flex-col gap-3">
        {invites.map((inv) => (
          <InviteRow key={inv.id} invite={inv} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Full-page invitations list for the /invites tab. Always renders — shows a
 * friendly empty state when there's nothing pending.
 */
export function InvitesPanel() {
  const { data, isLoading } = usePendingInvites();
  const invites = data?.invites ?? [];

  if (isLoading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-6" />
        </span>
        <p className="text-sm font-medium">No pending invitations</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          When someone invites you to their space, it&apos;ll show up here to
          accept or reject.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {invites.map((inv) => (
        <InviteRow key={inv.id} invite={inv} />
      ))}
    </ul>
  );
}

export function InviteRow({ invite }: { invite: PendingInviteDTO }) {
  const qc = useQueryClient();
  const name = inviterName(invite);

  const respond = useMutation({
    mutationFn: (action: "accept" | "reject") =>
      respondToInvite(invite.id, action),
    onSuccess: () => {
      // Visibility changed — refresh both the invite list and the feed.
      qc.invalidateQueries({ queryKey: ["invites", "mine"] });
      qc.invalidateQueries({ queryKey: ["photos"] });
    },
  });

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials(name)}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm">
            <span className="font-semibold">{name}</span> invited you to join
            {invite.role === "ADMIN" ? " as an admin" : ""}.
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3" />
            Accept to share posts with their space.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          onClick={() => respond.mutate("accept")}
          disabled={respond.isPending}
          aria-label="Accept invitation"
        >
          {respond.isPending && respond.variables === "accept" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Check />
          )}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => respond.mutate("reject")}
          disabled={respond.isPending}
          aria-label="Reject invitation"
        >
          {respond.isPending && respond.variables === "reject" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <X />
          )}
        </Button>
      </div>
    </li>
  );
}
