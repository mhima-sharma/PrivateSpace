import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";
import type { BlogCard as BlogCardType } from "@/services/blog.service";

export function BlogCard({ blog }: { blog: BlogCardType }) {
  return (
    <article className="group animate-fade-in overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg">
      <Link href={`/blog/${blog.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {blog.featuredImage ? (
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant="accent">{blog.category.name}</Badge>
            {blog.isTrending && <Badge variant="default">Trending</Badge>}
          </div>
        </div>
      </Link>
      <div className="space-y-3 p-5">
        <Link href={`/blog/${blog.slug}`}>
          <h3 className="line-clamp-2 font-heading text-lg font-bold leading-snug transition-colors group-hover:text-primary">
            {blog.title}
          </h3>
        </Link>
        {blog.excerpt && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{blog.excerpt}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{blog.publishedAt ? formatDate(blog.publishedAt) : formatDate(blog.createdAt)}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {blog.readingTime} min
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatNumber(blog.views)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
