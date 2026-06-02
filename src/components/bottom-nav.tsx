"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, PlusSquare, ShieldCheck } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth-guard";

/**
 * Instagram-style fixed bottom tab bar (mobile / tablet only — hidden on lg+,
 * where the top nav serves as the primary navigation).
 *
 * Every item maps to a REAL destination/action — no decorative tabs:
 *  • Home    → the dashboard feed
 *  • Create  → opens the existing upload modal (?compose=1, read by GalleryView)
 *  • Profile → "My posts" view (?view=mine, read by GalleryView)
 *  • Admin   → admin console (admins only)
 */
export function BottomNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view");

  const onDashboard = pathname === "/dashboard";
  const profileHref = `/u/${user.id}`;
  const isProfile = pathname === profileHref;
  const isHome = onDashboard && view !== "mine";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        <Tab href="/dashboard" label="Home" active={isHome}>
          <Home className={cn("size-6", isHome && "fill-foreground/10")} />
        </Tab>

        <Tab href="/dashboard?compose=1" label="Create" active={false}>
          <PlusSquare className="size-6" />
        </Tab>

        {user.role === "ADMIN" && (
          <Tab href="/admin" label="Admin" active={isAdmin}>
            <ShieldCheck className={cn("size-6", isAdmin && "fill-foreground/10")} />
          </Tab>
        )}

        <Tab href={profileHref} label="Profile" active={isProfile}>
          <span
            className={cn(
              "grid size-7 place-items-center rounded-full p-[2px] transition-all",
              isProfile ? "ring-brand" : "bg-border",
            )}
          >
            <span className="grid size-full place-items-center rounded-full bg-card text-[10px] font-semibold text-foreground">
              {initials(user.email)}
            </span>
          </span>
        </Tab>
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors active:scale-95",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <span className="leading-none">{label}</span>
    </Link>
  );
}
