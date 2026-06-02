import type { EventDTO } from "@/lib/events";

export type { EventDTO };

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Active (non-expired) events — shown on the dashboard. */
export async function fetchActiveEvents() {
  return asJson<{ events: EventDTO[] }>(
    await fetch("/api/events", { cache: "no-store" }),
  );
}

/** Every event (admin archive). */
export async function fetchAllEvents() {
  return asJson<{ events: EventDTO[] }>(
    await fetch("/api/admin/events", { cache: "no-store" }),
  );
}

export async function createEvent(input: {
  title: string;
  body?: string;
  file?: File | null;
}) {
  const fd = new FormData();
  fd.append("title", input.title);
  if (input.body) fd.append("body", input.body);
  if (input.file) fd.append("file", input.file);
  return asJson<{ event: EventDTO }>(
    await fetch("/api/admin/events", { method: "POST", body: fd }),
  );
}

export async function deleteEvent(id: string) {
  return asJson<{ ok: true }>(
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" }),
  );
}
