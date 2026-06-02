import { z } from "zod";

/**
 * Centralised Zod schemas. Every API route validates its input through one of
 * these — input validation is the first line of defence against injection and
 * malformed-data bugs.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

// Strong password policy. We don't cap usefully low; Argon2 handles length.
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200)
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

export const registerSchema = z
  .object({
    token: z.string().min(10).max(200),
    name: z.string().trim().min(1).max(80).optional(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createInviteSchema = z.object({
  email: emailSchema,
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

export const captionSchema = z
  .string()
  .trim()
  .max(500, "Caption must be 500 characters or fewer")
  .optional()
  .or(z.literal(""));

export const commentSchema = z.object({
  message: z.string().trim().min(1, "Comment cannot be empty").max(1000),
});

export const uploadMetaSchema = z.object({
  caption: captionSchema,
  albumId: z.string().cuid().optional(),
});

export const idParamSchema = z.object({
  id: z.string().cuid("Invalid id"),
});

// Profile edit — name (display) + a short free-text "about me" bio. Both are
// optional; an empty string clears the field.
export const profileSchema = z.object({
  name: z.string().trim().max(80, "Name must be 80 characters or fewer").optional(),
  bio: z.string().trim().max(300, "Bio must be 300 characters or fewer").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
