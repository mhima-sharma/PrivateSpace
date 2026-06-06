import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugifyLib from "slugify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return slugifyLib(input, { lower: true, strict: true, trim: true });
}

/** Estimate reading time in minutes from HTML/plain content (~200 wpm). */
export function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Strip HTML tags to plain text and optionally truncate. */
export function htmlToText(html: string, maxLength?: number): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (maxLength && text.length > maxLength) {
    return text.slice(0, maxLength).trimEnd() + "…";
  }
  return text;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatPrice(
  price: number | string | null | undefined,
  currency = "INR"
): string {
  if (price === null || price === undefined) return "";
  const value = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(value)) return "";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

/** Absolute URL helper for SEO / OG tags. */
export function absoluteUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
