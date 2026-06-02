import Link from "next/link";
import { ShieldCheck, Megaphone, MailPlus } from "lucide-react";
import { Brand } from "@/components/brand";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { InviteBadge } from "@/components/invites/invite-badge";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth-guard";

export function AppNav({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {/* Hidden on the home dashboard — nowhere to go back to there. */}
          <BackButton fallbackHref="/dashboard" hideOn={["/dashboard"]} />
          <Link
            href="/dashboard"
            aria-label="Home"
            className="rounded-lg transition-opacity hover:opacity-80"
          >
            <Brand />
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {/* Hidden on mobile/tablet — the bottom tab bar (lg:hidden) already
              provides these, so we only show them in the top nav on lg+. */}
          <Link
            href="/updates"
            className="mr-1 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:inline-flex"
          >
            <Megaphone className="size-4" />
            <span className="hidden sm:inline">Updates</span>
          </Link>
          <Link
            href="/invites"
            className="relative mr-1 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:inline-flex"
          >
            <MailPlus className="size-4" />
            <span className="hidden sm:inline">Invites</span>
            <InviteBadge className="absolute -right-0.5 -top-0.5" />
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="mr-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ShieldCheck className="size-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          {/* Theme + sign-out live in Profile → Settings on mobile; only shown
              in the header on lg+ (where there's no bottom tab bar). */}
          <span className="hidden lg:inline-flex">
            <ThemeToggle />
          </span>
          <span className="hidden lg:inline-flex">
            <SignOutButton />
          </span>
          <Link
            href={`/u/${user.id}`}
            aria-label="Your profile"
            title={user.email}
            className="ml-1.5 grid size-9 shrink-0 place-items-center rounded-full ring-brand p-[2px] transition-transform hover:scale-105"
          >
            <span className="grid size-full place-items-center rounded-full bg-card text-xs font-semibold text-foreground">
              {initials(user.email)}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
