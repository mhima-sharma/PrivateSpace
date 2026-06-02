"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Universal "Back" control. Goes back in history when possible, otherwise
 * navigates to `fallbackHref`. Renders nothing on `hideOn` routes (e.g. the
 * home page, where there's nowhere meaningful to go back to).
 */
export function BackButton({
  className,
  label = "Back",
  fallbackHref,
  hideOn = [],
}: {
  className?: string;
  label?: string;
  fallbackHref?: string;
  hideOn?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = React.useState(false);

  React.useEffect(() => {
    setCanGoBack(typeof window !== "undefined" && window.history.length > 1);
  }, []);

  if (hideOn.includes(pathname)) return null;
  // Nothing to go back to and no fallback — don't render a dead button.
  if (!canGoBack && !fallbackHref) return null;

  function onClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (fallbackHref) {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95",
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
