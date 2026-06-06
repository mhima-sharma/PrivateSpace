import { BlogCard } from "@/components/blog/blog-card";
import type { BlogCard as BlogCardType } from "@/services/blog.service";

export function BlogGrid({ blogs }: { blogs: BlogCardType[] }) {
  if (blogs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        No blogs found.
      </div>
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
}
