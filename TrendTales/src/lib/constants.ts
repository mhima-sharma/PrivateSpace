import type { Platform } from "@prisma/client";

export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "TrendTales",
  tagline: "Where Trends Meet Stories",
  description:
    "TrendTales — a modern blog and affiliate marketing platform covering Fashion, Travel, Technology, Lifestyle, Food, and the best deals.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  twitter: "@trendtales",
} as const;

/** Default categories suggested to the admin / used by the seed. */
export const DEFAULT_CATEGORIES = [
  { name: "Fashion", slug: "fashion" },
  { name: "Travel", slug: "travel" },
  { name: "Technology", slug: "technology" },
  { name: "Lifestyle", slug: "lifestyle" },
  { name: "Food", slug: "food" },
  { name: "Deals", slug: "deals" },
] as const;

export const TRAVEL_CATEGORY_SLUG = "travel";

/** Affiliate platform display metadata. */
export const PLATFORMS: Record<
  Platform,
  { label: string; buyLabel: string; color: string }
> = {
  MYNTRA: { label: "Myntra", buyLabel: "Buy on Myntra", color: "#ff3f6c" },
  AMAZON: { label: "Amazon", buyLabel: "Buy on Amazon", color: "#ff9900" },
  FLIPKART: { label: "Flipkart", buyLabel: "Buy on Flipkart", color: "#2874f0" },
  AJIO: { label: "Ajio", buyLabel: "Buy on Ajio", color: "#2e4053" },
  MEESHO: { label: "Meesho", buyLabel: "Buy on Meesho", color: "#570d6e" },
  CUSTOM: { label: "Store", buyLabel: "Buy Now", color: "#6d28d9" },
};

export const BLOGS_PER_PAGE = 9;
export const ADMIN_PAGE_SIZE = 10;
