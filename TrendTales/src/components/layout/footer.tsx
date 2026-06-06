import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SITE } from "@/lib/constants";
import { NewsletterForm } from "@/components/newsletter-form";

export function Footer({ categories }: { categories: { name: string; slug: string }[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg font-extrabold">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-gradient">{SITE.name}</span>
          </Link>
          <p className="text-sm text-muted-foreground">{SITE.tagline}.</p>
          <p className="text-sm text-muted-foreground">{SITE.description}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Categories</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-primary">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Company</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-primary">About</Link></li>
            <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary">Terms</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Newsletter</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Get the latest trends and stories in your inbox.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} {SITE.name}. All rights reserved.</p>
          <p className="text-xs">
            Some links are affiliate links — we may earn a commission at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
