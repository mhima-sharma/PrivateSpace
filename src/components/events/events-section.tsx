"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Clock } from "lucide-react";
import { fetchActiveEvents, type EventDTO } from "@/lib/events-client";
import { Card, CardContent } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";

/** Compact "expires in Xh / Xm" label from an ISO expiry timestamp. */
function expiresIn(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `expires in ${mins}m`;
  return `expires in ${Math.floor(mins / 60)}h`;
}

export function EventsSection() {
  const { data } = useQuery({
    queryKey: ["events", "active"],
    queryFn: fetchActiveEvents,
    // Re-check periodically so events drop off near their 24h expiry.
    refetchInterval: 60_000,
  });

  const events = data?.events ?? [];
  if (events.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Latest events</h2>
        </div>
        <ul className="flex flex-col divide-y divide-border/60">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function EventRow({ event }: { event: EventDTO }) {
  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
      {event.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imageUrl}
          alt=""
          className="size-14 shrink-0 rounded-lg object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{event.title}</p>
        {event.body && (
          <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">
            {event.body}
          </p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {timeAgo(event.createdAt)} · {expiresIn(event.expiresAt)}
        </p>
      </div>
    </li>
  );
}
