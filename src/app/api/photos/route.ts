import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { uploadMetaSchema } from "@/lib/validation";
import {
  isAllowedImageMime,
  sniffImageMime,
  putObject,
} from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { audit, auditCtxFromRequest } from "@/lib/audit";
import { serializePhoto } from "@/lib/serialize";

const photoInclude = {
  uploader: { select: { id: true, name: true, email: true } },
  _count: { select: { likes: true, comments: true } },
} as const;

// ── List the photo feed (most recent first, paginated) ─────────────────────
// scope=mine   → only the viewer's own posts ("My posts")
// scope=others → everyone else's posts (the "Feed")
// (no scope)   → everything the viewer may see
export const GET = handler(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const scope = url.searchParams.get("scope");
  const userId = url.searchParams.get("user");
  const take = Math.min(
    Math.max(Number(url.searchParams.get("take") ?? 24), 1),
    48,
  );

  // Admins can see hidden posts; everyone else only sees visible ones.
  const visibility = user.role === "ADMIN" ? {} : { isHidden: false };
  // `user=<id>` (a profile grid) takes precedence over scope.
  const ownership = userId
    ? { uploadedBy: userId }
    : scope === "mine"
      ? { uploadedBy: user.id }
      : scope === "others"
        ? { uploadedBy: { not: user.id } }
        : {};

  const photos = await prisma.photo.findMany({
    where: { ...visibility, ...ownership },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      ...photoInclude,
      likes: { where: { userId: user.id }, select: { userId: true } },
    },
  });

  const hasMore = photos.length > take;
  const page = hasMore ? photos.slice(0, take) : photos;

  return Response.json({
    photos: page.map((p) => serializePhoto(p, user)),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
});

// ── Upload a new photo (multipart/form-data: file + caption) ───────────────
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();

  const rl = await rateLimit(`upload:${user.id}`, 20, 60 * 60); // 20 / hour
  if (!rl.success)
    throw new HttpError(429, "Upload limit reached. Please try again later.");

  const form = await req.formData().catch(() => null);
  if (!form) throw new HttpError(400, "Expected multipart/form-data");

  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file provided");
  if (file.size === 0) throw new HttpError(400, "Empty file");
  if (file.size > env.MAX_UPLOAD_BYTES)
    throw new HttpError(413, "File is too large");

  const meta = uploadMetaSchema.parse({
    caption: form.get("caption") ?? undefined,
    albumId: form.get("albumId") ?? undefined,
  });

  const bytes = new Uint8Array(await file.arrayBuffer());

  // Validate by magic bytes, NOT the client-supplied Content-Type.
  const sniffed = sniffImageMime(bytes);
  if (!sniffed || !isAllowedImageMime(sniffed))
    throw new HttpError(415, "Unsupported image type");

  const stored = await putObject(bytes, sniffed);

  const photo = await prisma.photo.create({
    data: {
      uploadedBy: user.id,
      albumId: meta.albumId,
      storageKey: stored.key,
      mimeType: stored.mimeType,
      sizeBytes: stored.size,
      caption: meta.caption ? String(meta.caption) : null,
    },
    include: {
      ...photoInclude,
      likes: { where: { userId: user.id }, select: { userId: true } },
    },
  });

  await audit({
    userId: user.id,
    action: "photo.upload",
    targetType: "photo",
    targetId: photo.id,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ photo: serializePhoto(photo, user) }, { status: 201 });
});
