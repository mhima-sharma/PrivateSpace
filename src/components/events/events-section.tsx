"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Clock } from "lucide-react";
import { fetchActiveEvents, type EventDTO } from "@/lib/events-client";
import { Modal } from "@/components/ui/modal";
import { timeAgo, initials } from "@/lib/utils";

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
  const [openId, setOpenId] = React.useState<string | null>(null);

  const events = data?.events ?? [];
  if (events.length === 0) return null;

  const active = events.find((e) => e.id === openId) ?? null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Latest events</h2>
      </div>

      {/* Instagram-style story rail: full-bleed so bubbles scroll edge-to-edge
          without the container padding clipping the gradient rings. As more
          events arrive the row never wraps — it scrolls horizontally. */}
      <ul className="-mx-6 flex flex-nowrap snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {events.map((e) => (
          <StoryBubble key={e.id} event={e} onOpen={() => setOpenId(e.id)} />
        ))}
      </ul>

      <EventModal
        event={active}
        open={active !== null}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function StoryBubble({
  event,
  onOpen,
}: {
  event: EventDTO;
  onOpen: () => void;
}) {
  return (
    <li className="shrink-0 snap-start">
      <button
        onClick={onOpen}
        className="flex w-16 flex-col items-center gap-1.5 focus-visible:outline-none"
        aria-label={`Open event: ${event.title}`}
      >
        {/* Gradient ring → white gap → avatar (image or initials). */}
        <span className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2.5px] transition-transform active:scale-95">
          <span className="block rounded-full bg-background p-0.5">
            {event.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.imageUrl}
                alt=""
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-16 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {initials(event.title)}
              </span>
            )}
          </span>
        </span>
        <span className="w-full truncate text-center text-xs text-muted-foreground">
          {event.title}
        </span>
      </button>
    </li>
  );
}

function EventModal({
  event,
  open,
  onClose,
}: {
  event: EventDTO | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!event) return null;
  const author =
    event.author.name ?? event.author.email.split("@")[0] ?? event.author.email;

  return (
    <Modal open={open} onClose={onClose} title={event.title}>
      <div className="flex flex-col gap-4">
        {event.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt=""
            className="max-h-[60vh] w-full rounded-xl bg-muted/40 object-contain"
          />
        )}

        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(author)}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium">{author}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {timeAgo(event.createdAt)}
              <span className="ml-1 text-primary/80">
                · {expiresIn(event.expiresAt)}
              </span>
            </p>
          </div>
        </div>

        {event.body && (
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {event.body}
          </p>
        )}
      </div>
    </Modal>
  );
}
