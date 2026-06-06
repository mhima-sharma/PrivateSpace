import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Eye, Calendar } from "lucide-react";
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { absoluteUrl, formatDate, formatNumber, htmlToText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShareButtons } from "@/components/blog/share-buttons";
import { CommentsSection } from "@/components/blog/comments-section";
import { ViewTracker } from "@/components/blog/view-tracker";
import { ProductCard } from "@/components/product/product-card";
import { DestinationBlock } from "@/components/destination/destination-block";
import { BlogCard } from "@/components/blog/blog-card";
import { getBlogBySlug, getRelatedBlogs } from "@/services/blog.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) return buildMetadata({ title: "Not found", noIndex: true });

  const description =
    blog.metaDescription || blog.excerpt || htmlToText(blog.content, 160);
  return buildMetadata({
    title: blog.metaTitle || blog.title,
    description,
    path: `/blog/${blog.slug}`,
    image: blog.featuredImage,
    type: "article",
    publishedTime: blog.publishedAt?.toISOString(),
    authors: blog.author.name ? [blog.author.name] : undefined,
  });
}

function asTags(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) notFound();

  const related = await getRelatedBlogs(blog.id, blog.categoryId, 3);
  const url = absoluteUrl(`/blog/${blog.slug}`);
  const tags = asTags(blog.tags);
  const description = blog.excerpt || htmlToText(blog.content, 160);

  return (
    <article className="py-10">
      <ViewTracker slug={blog.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              title: blog.title,
              description,
              image: blog.featuredImage,
              url,
              authorName: blog.author.name ?? "TrendTales",
              datePublished: blog.publishedAt?.toISOString(),
              dateModified: blog.updatedAt.toISOString(),
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", url: absoluteUrl("/") },
              { name: blog.category.name, url: absoluteUrl(`/category/${blog.category.slug}`) },
              { name: blog.title, url },
            ])
          ),
        }}
      />

      <div className="container max-w-3xl">
        {/* Header */}
        <div className="space-y-4">
          <Link href={`/category/${blog.category.slug}`}>
            <Badge variant="accent">{blog.category.name}</Badge>
          </Link>
          <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-4xl">
            {blog.title}
          </h1>
          {blog.excerpt && <p className="text-lg text-muted-foreground">{blog.excerpt}</p>}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {blog.author.image && <AvatarImage src={blog.author.image} alt={blog.author.name ?? ""} />}
                <AvatarFallback>{(blog.author.name ?? "T")[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{blog.author.name ?? "TrendTales"}</span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {blog.publishedAt ? formatDate(blog.publishedAt) : formatDate(blog.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {blog.readingTime} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {formatNumber(blog.views)} views
            </span>
          </div>
        </div>

        {/* Featured image */}
        {blog.featuredImage && (
          <div className="relative my-8 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
            <Image src={blog.featuredImage} alt={blog.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          </div>
        )}

        {/* Content */}
        <div
          className="tiptap-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Travel destination block */}
        {blog.destination && <DestinationBlock destination={blog.destination} />}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((t) => (
              <Badge key={t} variant="secondary">#{t}</Badge>
            ))}
          </div>
        )}

        <Separator className="my-8" />
        <ShareButtons url={url} title={blog.title} />

        {/* Affiliate products */}
        {blog.products.length > 0 && (
          <section className="my-10 space-y-4">
            <h2 className="font-heading text-2xl font-bold">Recommended Products</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {blog.products.map((p) => (
                <ProductCard key={p.id} product={p} blogId={blog.id} />
              ))}
            </div>
          </section>
        )}

        <Separator className="my-8" />

        {/* Comments */}
        <CommentsSection blogId={blog.id} comments={blog.comments} />
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <div className="container mt-16">
          <h2 className="mb-8 font-heading text-2xl font-extrabold">Related Stories</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((b) => (
              <BlogCard key={b.id} blog={b} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
