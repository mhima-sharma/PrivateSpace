import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * Builds a URL for a given page using the provided base path and existing
 * query params (page is overwritten).
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) search.set(k, v);
    }
    search.set("page", String(p));
    return `${basePath}?${search.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
    return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
  });

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={buttonVariants({ variant: "outline", size: "icon" })}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(buttonVariants({ variant: "outline", size: "icon" }), "pointer-events-none opacity-50")}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const gap = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {gap && <span className="px-1 text-muted-foreground">…</span>}
            <Link
              href={buildHref(p)}
              className={buttonVariants({ variant: p === page ? "default" : "outline", size: "icon" })}
            >
              {p}
            </Link>
          </span>
        );
      })}

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className={buttonVariants({ variant: "outline", size: "icon" })}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(buttonVariants({ variant: "outline", size: "icon" }), "pointer-events-none opacity-50")}>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
