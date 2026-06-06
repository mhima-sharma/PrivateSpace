import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { BlogGrid } from "@/components/blog/blog-grid";
import { SearchBar } from "@/components/shared/search-bar";
import { Pagination } from "@/components/shared/pagination";
import { listPublishedBlogs } from "@/services/blog.service";
import { getActiveCategories } from "@/services/category.service";

export const metadata: Metadata = buildMetadata({
  title: "All Blogs",
  description: "Browse all stories on TrendTales — fashion, travel, tech, food and more.",
  path: "/blogs",
});

interface SearchParams {
  page?: string;
  q?: string;
  category?: string;
  sort?: string;
}

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = sp.sort === "popular" ? "popular" : "latest";

  const [{ items, totalPages, total }, categories] = await Promise.all([
    listPublishedBlogs({ page, query: sp.q, categorySlug: sp.category, sort }),
    getActiveCategories(),
  ]);

  return (
    <div className="container space-y-8 py-12">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-extrabold md:text-4xl">All Stories</h1>
        <p className="text-muted-foreground">{total} stories and counting</p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchBar className="w-full md:max-w-sm" defaultValue={sp.q} />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={{ query: { ...(sp.q ? { q: sp.q } : {}), ...(sp.category ? { category: sp.category } : {}), sort: "latest" } }}
            className={cn(buttonVariants({ variant: sort === "latest" ? "default" : "outline", size: "sm" }))}
          >
            Latest
          </Link>
          <Link
            href={{ query: { ...(sp.q ? { q: sp.q } : {}), ...(sp.category ? { category: sp.category } : {}), sort: "popular" } }}
            className={cn(buttonVariants({ variant: sort === "popular" ? "default" : "outline", size: "sm" }))}
          >
            Popular
          </Link>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/blogs"
          className={cn(buttonVariants({ variant: !sp.category ? "default" : "outline", size: "sm" }), "rounded-full")}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/blogs?category=${c.slug}`}
            className={cn(
              buttonVariants({ variant: sp.category === c.slug ? "default" : "outline", size: "sm" }),
              "rounded-full"
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <BlogGrid blogs={items} />

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/blogs"
        params={{ q: sp.q, category: sp.category, sort }}
      />
    </div>
  );
}
