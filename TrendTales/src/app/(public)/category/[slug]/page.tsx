import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { BlogGrid } from "@/components/blog/blog-grid";
import { Pagination } from "@/components/shared/pagination";
import { getCategoryBySlug } from "@/services/category.service";
import { listPublishedBlogs } from "@/services/blog.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return buildMetadata({ title: "Category", path: `/category/${slug}` });
  return buildMetadata({
    title: category.name,
    description: category.description ?? `Stories in ${category.name} on TrendTales.`,
    path: `/category/${slug}`,
    image: category.image,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category || !category.isActive) notFound();

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { items, totalPages, total } = await listPublishedBlogs({
    page,
    categorySlug: slug,
  });

  return (
    <div className="container space-y-8 py-12">
      <header className="space-y-2 border-b pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Category</p>
        <h1 className="font-heading text-3xl font-extrabold md:text-4xl">{category.name}</h1>
        {category.description && (
          <p className="max-w-2xl text-muted-foreground">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground">{total} stories</p>
      </header>

      <BlogGrid blogs={items} />

      <Pagination page={page} totalPages={totalPages} basePath={`/category/${slug}`} />
    </div>
  );
}
