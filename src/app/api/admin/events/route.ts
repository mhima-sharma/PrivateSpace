import { handler, assertSameOrigin } from "@/lib/api";
import { requireAdmin, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  createEventSchema,
  eventExpiry,
  listAllEvents,
  serializeEvent,
} from "@/lib/events";
import {
  isAllowedImageMime,
  sniffImageMime,
  putObject,
} from "@/lib/storage";
import { audit, auditCtxFromRequest } from "@/lib/audit";

const authorSelect = {
  author: { select: { id: true, name: true, email: true } },
} as const;

// ── Archive: every event the admin has ever posted (newest first) ──────────
export const GET = handler(async () => {
  const admin = await requireAdmin();
  return Response.json({ events: await listAllEvents(admin.id) });
});

// ── Create an event (multipart/form-data: title, body, optional file) ──────
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();

  const form = await req.formData().catch(() => null);
  if (!form) throw new HttpError(400, "Expected multipart/form-data");

  const meta = createEventSchema.parse({
    title: form.get("title") ?? undefined,
    body: form.get("body") ?? undefined,
  });

  // Image is optional. When present, validate + store exactly like a photo.
  let stored: { key: string; mimeType: string; size: number } | null = null;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > env.MAX_UPLOAD_BYTES)
      throw new HttpError(413, "File is too large");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const sniffed = sniffImageMime(bytes);
    if (!sniffed || !isAllowedImageMime(sniffed))
      throw new HttpError(415, "Unsupported image type");
    stored = await putObject(bytes, sniffed);
  }

  const event = await prisma.event.create({
    data: {
      title: meta.title,
      body: meta.body ? meta.body : null,
      createdById: admin.id,
      expiresAt: eventExpiry(),
      storageKey: stored?.key ?? null,
      mimeType: stored?.mimeType ?? null,
      sizeBytes: stored?.size ?? null,
    },
    include: authorSelect,
  });

  await audit({
    userId: admin.id,
    action: "event.create",
    targetType: "event",
    targetId: event.id,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ event: serializeEvent(event) }, { status: 201 });
});
