import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { absoluteUrl } from "@/lib/utils";

interface BuildMetadataArgs {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  noIndex?: boolean;
}

/** Central metadata builder: OG + Twitter cards + canonical. */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  publishedTime,
  authors,
  noIndex,
}: BuildMetadataArgs): Metadata {
  const fullTitle = title ? `${title} — ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const desc = description ?? SITE.description;
  const url = absoluteUrl(path);
  const ogImage = image ?? absoluteUrl("/og-default.png");

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(SITE.url),
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE.name,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title ?? SITE.name }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [ogImage],
      creator: SITE.twitter,
    },
  };
}

/** JSON-LD for a blog post (Article schema). */
export function articleJsonLd(args: {
  title: string;
  description: string;
  image?: string | null;
  url: string;
  authorName: string;
  datePublished?: string | null;
  dateModified?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: args.title,
    description: args.description,
    image: args.image ? [args.image] : undefined,
    author: { "@type": "Person", name: args.authorName },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    },
    datePublished: args.datePublished ?? undefined,
    dateModified: args.dateModified ?? args.datePublished ?? undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": args.url },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/blogs?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
