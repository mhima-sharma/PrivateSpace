import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { SearchBar } from "@/components/shared/search-bar";
import { Badge } from "@/components/ui/badge";
import { globalSearch } from "@/services/search.service";

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search blogs, products, categories and destinations on TrendTales.",
  path: "/search",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query
    ? await globalSearch(query)
    : { blogs: [], products: [], categories: [], destinations: [] };

  const totalResults =
    results.blogs.length +
    results.products.length +
    results.categories.length +
    results.destinations.length;

  return (
    <div className="container max-w-4xl space-y-8 py-12">
      <header className="space-y-4">
        <h1 className="font-heading text-3xl font-extrabold">Search</h1>
        <SearchBar defaultValue={query} />
        {query && (
          <p className="text-sm text-muted-foreground">
            {totalResults} result{totalResults === 1 ? "" : "s"} for “{query}”
          </p>
        )}
      </header>

      {query && totalResults === 0 && (
        <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          Nothing found. Try a different search.
        </p>
      )}

      {results.categories.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {results.categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`}>
                <Badge variant="outline">{c.name}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.blogs.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Blogs</h2>
          <ul className="space-y-3">
            {results.blogs.map((b) => (
              <li key={b.id}>
                <Link href={`/blog/${b.slug}`} className="flex gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  {b.featuredImage && (
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded">
                      <Image src={b.featuredImage} alt={b.title} fill className="object-cover" sizes="96px" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{b.title}</p>
                    {b.excerpt && <p className="line-clamp-1 text-sm text-muted-foreground">{b.excerpt}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.destinations.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Destinations</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {results.destinations.map((d) => (
              <li key={d.id}>
                <Link href={`/destinations/${d.slug}`} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  {d.coverImage && (
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded">
                      <Image src={d.coverImage} alt={d.name} fill className="object-cover" sizes="64px" />
                    </div>
                  )}
                  <span className="font-medium">{d.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.products.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Products</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {results.products.map((p) => (
              <li key={p.id}>
                <a
                  href={`/go/${p.id}`}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  {p.image && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                      <Image src={p.image} alt={p.name} fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  <span className="flex-1 font-medium">{p.name}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
