"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BlogCard } from "@/services/blog.service";

export function HeroSlider({ blogs }: { blogs: BlogCard[] }) {
  const [index, setIndex] = React.useState(0);
  const count = blogs.length;

  const go = React.useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  React.useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;
  const blog = blogs[index];

  return (
    <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
      {blog.featuredImage ? (
        <Image
          src={blog.featuredImage}
          alt={blog.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full gradient-brand" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

      <div className="container relative flex h-full flex-col justify-end pb-16">
        <div className="max-w-2xl space-y-4 text-white animate-fade-in">
          <Badge variant="accent">{blog.category.name}</Badge>
          <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-5xl">
            {blog.title}
          </h1>
          {blog.excerpt && <p className="line-clamp-2 text-white/80 md:text-lg">{blog.excerpt}</p>}
          <div className="flex items-center gap-4">
            <Button asChild variant="brand" size="lg">
              <Link href={`/blog/${blog.slug}`}>Read story</Link>
            </Button>
            <span className="flex items-center gap-1 text-sm text-white/70">
              <Clock className="h-4 w-4" /> {blog.readingTime} min read
            </span>
          </div>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {blogs.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
