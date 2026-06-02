import { z } from "zod";

/**
 * Centralised, validated environment access. Importing this module on the
 * server fails fast (at boot) if a required variable is missing or malformed,
 * instead of producing confusing runtime errors deep in a request handler.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  NEXTAUTH_URL: z.string().url(),
  AUTH_TRUST_HOST: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  WEBAUTHN_RP_ID: z.string().min(1),
  WEBAUTHN_RP_NAME: z.string().min(1),
  WEBAUTHN_RP_ORIGIN: z.string().url(),

  STORAGE_DRIVER: z.enum(["local", "s3", "cloudinary"]).default("local"),
  IMAGE_URL_SIGNING_SECRET: z.string().min(16),
  IMAGE_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(8_388_608),

  // ── Cloudinary (only when STORAGE_DRIVER=cloudinary) ──────────────────────
  // Assets are uploaded with delivery type "authenticated" (private); bytes are
  // only ever fetched server-side via a signed URL and re-streamed through our
  // own /api/images/[id] gate. Cloudinary URLs never reach the client.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v !== "false"),

  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  INVITE_TTL_HOURS: z.coerce.number().int().positive().default(72),
});

// Only validate on the server. (Client code must use NEXT_PUBLIC_* directly.)
const parsed =
  typeof window === "undefined"
    ? serverSchema.safeParse(process.env)
    : { success: true as const, data: {} as z.infer<typeof serverSchema> };

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  throw new Error("Invalid environment variables. See logs above.");
}

export const env = parsed.data;
