import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
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
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="mr-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ShieldCheck className="size-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <ThemeToggle />
          <SignOutButton />
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
