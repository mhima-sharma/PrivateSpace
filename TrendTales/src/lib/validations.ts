import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Name is required").max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  description: z.string().max(500).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const blogSchema = z.object({
  title: z.string().min(3, "Title is required").max(180),
  slug: z
    .string()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  excerpt: z.string().max(400).optional().or(z.literal("")),
  content: z.string().min(1, "Content cannot be empty"),
  featuredImage: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().min(1, "Choose a category"),
  destinationId: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  scheduledFor: z.string().optional().or(z.literal("")),
  metaTitle: z.string().max(180).optional().or(z.literal("")),
  metaDescription: z.string().max(300).optional().or(z.literal("")),
});
export type BlogInput = z.infer<typeof blogSchema>;

export const productSchema = z.object({
  name: z.string().min(2, "Name is required").max(160),
  description: z.string().max(800).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().default("INR"),
  affiliateUrl: z.string().url("Enter a valid URL"),
  platform: z.enum(["MYNTRA", "AMAZON", "FLIPKART", "AJIO", "MEESHO", "CUSTOM"]),
  blogId: z.string().optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
});
export type ProductInput = z.infer<typeof productSchema>;

export const destinationSchema = z.object({
  name: z.string().min(2, "Name is required").max(160),
  slug: z
    .string()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  location: z.string().max(160).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  bestTimeToVisit: z.string().max(160).optional().or(z.literal("")),
  budget: z.string().max(160).optional().or(z.literal("")),
  travelTips: z.string().max(4000).optional().or(z.literal("")),
  gallery: z.array(z.string().url()).default([]),
  mapUrl: z.string().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
});
export type DestinationInput = z.infer<typeof destinationSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const commentSchema = z.object({
  blogId: z.string().min(1),
  authorName: z.string().min(2, "Name is required").max(80),
  authorEmail: z.string().email().optional().or(z.literal("")),
  content: z.string().min(3, "Comment is too short").max(2000),
});
export type CommentInput = z.infer<typeof commentSchema>;
