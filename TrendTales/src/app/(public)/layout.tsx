import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getActiveCategories } from "@/services/category.service";

// Rendered per-request so the build never needs build-time DB access.
// HTML is still fully server-rendered (SEO-friendly); add ISR/caching later
// once a build-time-reachable database is configured.
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getActiveCategories();
  const navCategories = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categories={navCategories} />
      <main className="flex-1">{children}</main>
      <Footer categories={navCategories} />
    </div>
  );
}
