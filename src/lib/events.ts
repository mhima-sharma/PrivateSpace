import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signEventImagePath } from "@/lib/signed-url";

/**
 * Story-style events.
 *
 * An admin creates an event (title + optional note + optional image). It shows
 * on the dashboard for {@link EVENT_TTL_HOURS} hours, then drops out of the
 * active feed (filtered by `expiresAt > now`) but is kept forever so the admin
 * can browse the archive and see when each one was posted.
 */

export const EVENT_TTL_HOURS = 24;

/** Expiry timestamp for a freshly-created event (now + TTL). */
export function eventExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + EVENT_TTL_HOURS * 60 * 60 * 1000);
}

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  body: z.string().trim().max(600).optional().or(z.literal("")),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export interface EventDTO {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null; // signed, short-lived; null for text-only events
  createdAt: string;
  expiresAt: string;
  isActive: boolean; // false once expired (only ever true in the active feed)
  author: { id: string; name: string | null; email: string };
}

type EventWithAuthor = {
  id: string;
  title: string;
  body: string | null;
  storageKey: string | null;
  createdAt: Date;
  expiresAt: Date;
  author: { id: string; name: string | null; email: string };
};

export function serializeEvent(
  event: EventWithAuthor,
  now: Date = new Date(),
): EventDTO {
  return {
    id: event.id,
    title: event.title,
    body: event.body,
    imageUrl: event.storageKey ? signEventImagePath(event.id) : null,
    createdAt: event.createdAt.toISOString(),
    expiresAt: event.expiresAt.toISOString(),
    isActive: event.expiresAt > now,
    author: event.author,
  };
}

const authorSelect = {
  author: { select: { id: true, name: true, email: true } },
} as const;

/** Active events for the dashboard strip (not yet expired, newest first). */
export async function listActiveEvents(): Promise<EventDTO[]> {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    include: authorSelect,
  });
  return events.map((e) => serializeEvent(e, now));
}

/** Every event, newest first — the admin archive. */
export async function listAllEvents(): Promise<EventDTO[]> {
  const now = new Date();
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: authorSelect,
  });
  return events.map((e) => serializeEvent(e, now));
}
