import { createHash, createHmac, randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

/**
 * Storage abstraction for private media.
 *
 * Three drivers:
 *  - "local":      writes to ./storage (DEV ONLY — not durable on serverless).
 *  - "s3":         writes to a PRIVATE S3-compatible bucket (S3 / R2 / B2 / MinIO).
 *  - "cloudinary": uploads with delivery type "authenticated" (private).
 *
 * In BOTH cases, objects are never publicly readable. Bytes are only ever
 * served back through our authenticated, signed /api/images/[id] route.
 */

export interface StoredObject {
  key: string;
  size: number;
  mimeType: string;
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

/**
 * Validate that the file's leading bytes (magic numbers) match an allowed
 * image type. Prevents a malicious file with a faked Content-Type / extension
 * (defence-in-depth against polyglot / content-sniffing attacks).
 */
export function sniffImageMime(buf: Uint8Array): string | null {
  const b = buf;
  if (b.length < 12) return null;
  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  )
    return "image/png";
  // GIF: "GIF8"
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38)
    return "image/gif";
  // WEBP: "RIFF"...."WEBP"
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return "image/webp";
  // AVIF/HEIF: "....ftyp" with avif/heic brand
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8] ?? 0, b[9] ?? 0, b[10] ?? 0, b[11] ?? 0);
    if (brand.startsWith("avif") || brand.startsWith("avis"))
      return "image/avif";
  }
  return null;
}

function newKey(mime: string): string {
  const ext = EXT_BY_MIME[mime] ?? "bin";
  const rand = randomBytes(16).toString("hex");
  const day = new Date().toISOString().slice(0, 10);
  return `uploads/${day}/${rand}.${ext}`;
}

const LOCAL_ROOT = path.join(process.cwd(), "storage");

export async function putObject(
  data: Uint8Array,
  mimeType: string,
): Promise<StoredObject> {
  // Cloudinary: optimize on the way in. An incoming transformation converts
  // every upload to a single WEBP derivative (≤1000px wide, auto:low quality).
  // Only the optimized asset is stored — so storage AND delivery shrink, while
  // staying visually good for the web. (See IMAGE_TRANSFORM below.)
  if (env.STORAGE_DRIVER === "cloudinary") {
    const key = newKey("image/webp");
    const { bytes } = await cloudinaryPut(key, data);
    return { key, size: bytes, mimeType: "image/webp" };
  }

  // local / s3 keep the original bytes & format unchanged.
  const key = newKey(mimeType);
  if (env.STORAGE_DRIVER === "s3") {
    await s3Put(key, data, mimeType);
  } else {
    const dest = path.join(LOCAL_ROOT, key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, data);
  }
  return { key, size: data.byteLength, mimeType };
}

export async function getObject(key: string): Promise<Uint8Array> {
  if (env.STORAGE_DRIVER === "cloudinary") return cloudinaryGet(key);
  if (env.STORAGE_DRIVER === "s3") return s3Get(key);
  const dest = path.join(LOCAL_ROOT, key);
  return new Uint8Array(await readFile(dest));
}

export async function deleteObject(key: string): Promise<void> {
  if (env.STORAGE_DRIVER === "cloudinary") return cloudinaryDelete(key);
  if (env.STORAGE_DRIVER === "s3") return s3Delete(key);
  const dest = path.join(LOCAL_ROOT, key);
  await unlink(dest).catch(() => {});
}

// ── Cloudinary (private "authenticated" delivery) ──────────────────────────
// Objects are stored privately. We never hand a Cloudinary URL to the browser;
// instead getObject() fetches the bytes through a short signed URL server-side
// and our /api/images/[id] route re-streams them behind session + signature.

let cloudinaryConfigured = false;
function cloudinaryClient() {
  const cloud_name = env.CLOUDINARY_CLOUD_NAME;
  const api_key = env.CLOUDINARY_API_KEY;
  const api_secret = env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "STORAGE_DRIVER=cloudinary but CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET are not all set",
    );
  }
  if (!cloudinaryConfigured) {
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    cloudinaryConfigured = true;
  }
  return cloudinary;
}

// Our storage key is "uploads/<day>/<rand>.<ext>". Cloudinary's public_id is the
// same path WITHOUT the extension; the extension is the delivery format.
function cloudinaryPublicId(key: string): string {
  return key.replace(/\.[^/.]+$/, "");
}

/**
 * Optimization applied to every image as it's uploaded (an "incoming
 * transformation"): convert to WEBP, cap the width at 1000px while keeping the
 * aspect ratio (crop "limit" never upscales or stretches), and let Cloudinary
 * pick an aggressive-but-acceptable quality. Typically lands around 100–200KB.
 */
const IMAGE_TRANSFORM = {
  width: 1000,
  crop: "limit",
  quality: "auto:low",
  fetch_format: "webp",
};

function cloudinaryPut(
  key: string,
  data: Uint8Array,
): Promise<{ bytes: number }> {
  const c = cloudinaryClient();
  const public_id = cloudinaryPublicId(key);
  return new Promise((resolve, reject) => {
    const stream = c.uploader.upload_stream(
      {
        public_id,
        resource_type: "image",
        type: "authenticated", // private: not publicly accessible
        overwrite: false,
        // Store a single optimized WEBP derivative (no original retained).
        format: "webp",
        transformation: [IMAGE_TRANSFORM],
      },
      (err, result) =>
        err
          ? reject(err)
          : resolve({ bytes: result?.bytes ?? data.byteLength }),
    );
    stream.end(Buffer.from(data));
  });
}

async function cloudinaryGet(key: string): Promise<Uint8Array> {
  const c = cloudinaryClient();
  const ext = key.split(".").pop();
  const url = c.url(cloudinaryPublicId(key), {
    resource_type: "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    ...(ext ? { format: ext } : {}),
  });
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Cloudinary GET failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function cloudinaryDelete(key: string): Promise<void> {
  const c = cloudinaryClient();
  await c.uploader.destroy(cloudinaryPublicId(key), {
    resource_type: "image",
    type: "authenticated",
    invalidate: true,
  });
}

// ── Minimal S3 SigV4 client (no SDK dependency) ───────────────────────────
// Implements just the GET/PUT/DELETE object calls we need against any
// S3-compatible endpoint. Keeps the dependency surface small and auditable.

function s3Config() {
  const endpoint = env.S3_ENDPOINT;
  const bucket = env.S3_BUCKET;
  const accessKey = env.S3_ACCESS_KEY_ID;
  const secretKey = env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKey || !secretKey) {
    throw new Error(
      "STORAGE_DRIVER=s3 but S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY are not all set",
    );
  }
  return { endpoint, bucket, accessKey, secretKey, region: env.S3_REGION };
}

function objectUrl(key: string) {
  const { endpoint, bucket } = s3Config();
  const base = endpoint.replace(/\/$/, "");
  return env.S3_FORCE_PATH_STYLE
    ? `${base}/${bucket}/${encodeKey(key)}`
    : `${base.replace("://", `://${bucket}.`)}/${encodeKey(key)}`;
}

function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}
function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

async function s3Fetch(
  method: "GET" | "PUT" | "DELETE",
  key: string,
  body?: Uint8Array,
  contentType?: string,
): Promise<Response> {
  const { accessKey, secretKey, region } = s3Config();
  const url = new URL(objectUrl(key));
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "s3";
  const payloadHash = sha256Hex(body ?? new Uint8Array());

  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders =
    Object.keys(headers)
      .sort()
      .map((h) => `${h}:${headers[h]}\n`)
      .join("") ;

  const canonicalRequest = [
    method,
    url.pathname,
    url.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(url, {
    method,
    headers: { ...headers, Authorization: authorization },
    body: body as BodyInit | undefined,
    cache: "no-store",
  });
}

async function s3Put(key: string, data: Uint8Array, mime: string) {
  const res = await s3Fetch("PUT", key, data, mime);
  if (!res.ok) throw new Error(`S3 PUT failed: ${res.status} ${await res.text()}`);
}
async function s3Get(key: string): Promise<Uint8Array> {
  const res = await s3Fetch("GET", key);
  if (!res.ok) throw new Error(`S3 GET failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}
async function s3Delete(key: string) {
  const res = await s3Fetch("DELETE", key);
  if (!res.ok && res.status !== 404)
    throw new Error(`S3 DELETE failed: ${res.status}`);
}
