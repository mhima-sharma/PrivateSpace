import { Mail } from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import { SectionHeading } from "@/components/shared/section-heading";
import { BlogCard } from "@/components/blog/blog-card";
import { CategoryCard } from "@/components/category/category-card";
import { ProductCard } from "@/components/product/product-card";
import { DestinationCard } from "@/components/destination/destination-card";
import { NewsletterForm } from "@/components/newsletter-form";
import {
  getFeaturedBlogs,
  getLatestBlogs,
  getTrendingBlogs,
} from "@/services/blog.service";
import { getPopularCategories } from "@/services/category.service";
import { getFeaturedProducts } from "@/services/product.service";
import { getFeaturedDestinations } from "@/services/destination.service";

export default async function HomePage() {
  const [featured, latest, trending, categories, products, destinations] =
    await Promise.all([
      getFeaturedBlogs(5),
      getLatestBlogs(6),
      getTrendingBlogs(3),
      getPopularCategories(6),
      getFeaturedProducts(4),
      getFeaturedDestinations(3),
    ]);

  // Hero falls back to latest blogs when nothing is marked featured.
  const heroBlogs = featured.length > 0 ? featured : latest.slice(0, 5);

  return (
    <>
      <HeroSlider blogs={heroBlogs} />

      <div className="container space-y-20 py-16">
        {/* Trending categories */}
        {categories.length > 0 && (
          <section>
            <SectionHeading
              title="Explore Categories"
              subtitle="Find stories on the topics you love"
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {categories.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}
            </div>
          </section>
        )}

        {/* Trending blogs */}
        {trending.length > 0 && (
          <section>
            <SectionHeading title="Trending Now" subtitle="The stories everyone's reading" href="/blogs?sort=popular" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((b) => (
                <BlogCard key={b.id} blog={b} />
              ))}
            </div>
          </section>
        )}

        {/* Latest blogs */}
        <section>
          <SectionHeading title="Latest Stories" subtitle="Fresh off the press" href="/blogs" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((b) => (
              <BlogCard key={b.id} blog={b} />
            ))}
          </div>
        </section>

        {/* Featured products */}
        {products.length > 0 && (
          <section>
            <SectionHeading title="Featured Products" subtitle="Hand-picked deals worth your money" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Popular destinations */}
        {destinations.length > 0 && (
          <section>
            <SectionHeading title="Popular Destinations" subtitle="Plan your next adventure" href="/destinations" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((d) => (
                <DestinationCard key={d.id} destination={d} />
              ))}
            </div>
          </section>
        )}

        {/* Newsletter */}
        <section className="overflow-hidden rounded-3xl gradient-brand p-8 text-white md:p-14">
          <div className="mx-auto max-w-2xl text-center">
            <Mail className="mx-auto mb-4 h-10 w-10" />
            <h2 className="font-heading text-2xl font-extrabold md:text-3xl">
              Never miss a trend
            </h2>
            <p className="mt-2 text-white/80">
              Subscribe to get the latest stories, deals, and travel guides in your inbox.
            </p>
            <div className="mx-auto mt-6 max-w-md [&_input]:bg-white/90 [&_input]:text-black">
              <NewsletterForm />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
