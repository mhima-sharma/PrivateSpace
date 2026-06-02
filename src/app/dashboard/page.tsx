import { Suspense } from "react";
import { Images, Lock, ShieldCheck, Users, Heart } from "lucide-react";
import { getSessionUser } from "@/lib/auth-guard";
import { GalleryView } from "@/components/memories/gallery-view";
import { InstallPrompt } from "@/components/install-prompt";
import { EventsSection } from "@/components/events/events-section";
import { InvitesSection } from "@/components/invites/invites-section";

const TRUST_BADGES = [
  { icon: Lock, label: "Private" },
  { icon: ShieldCheck, label: "Secure" },
  { icon: Users, label: "Invite only" },
  { icon: Heart, label: "Yours" },
];

export default async function DashboardPage() {
  const user = await getSessionUser();
  const displayName = user?.email?.split("@")[0] ?? null;

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="bg-mesh relative overflow-hidden border-b border-border/60">
        <div className="container grid items-center gap-6 py-8 sm:py-10 lg:grid-cols-[1fr_minmax(0,640px)_1fr]">
          {/* Left: decorative photo stack (desktop only). */}
          <PhotoStack className="hidden justify-self-center lg:flex" />

          {/* Center: welcome message. */}
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Images className="size-3.5" /> Private gallery
            </span>

            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              {displayName ? (
                <>
                  Welcome back,{" "}
                  <span className="text-primary">{displayName}</span>
                </>
              ) : (
                <>
                  Your <span className="text-primary">Private Space</span>
                </>
              )}
            </h1>

            <p className="max-w-md text-sm text-muted-foreground">
              Your private photo space — only invited people can see these.
            </p>

            <ul className="mt-1 flex flex-wrap items-center justify-center gap-2">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  <Icon className="size-3.5 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: decorative vault (desktop only). */}
          <Vault className="hidden justify-self-center lg:block" />
        </div>
      </section>

      {/* Content */}
      <section className="container py-6 sm:py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <InstallPrompt />
          <InvitesSection />
          <EventsSection />
          <Suspense fallback={<div className="h-screen" />}>
            <GalleryView email={user?.email ?? ""} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

/** Decorative cluster of tilted "photo" cards (pure CSS, no assets). */
function PhotoStack({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative h-40 w-52">
        <div className="absolute left-0 top-3 size-28 -rotate-12 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500 via-purple-600 to-slate-900 shadow-xl" />
        <div className="absolute right-2 top-0 size-28 rotate-6 rounded-2xl border border-white/10 bg-gradient-to-br from-amber-400 via-rose-500 to-purple-700 shadow-xl" />
        <div className="absolute bottom-0 left-10 size-28 -rotate-3 rounded-2xl border border-white/10 bg-gradient-to-br from-orange-300 via-amber-600 to-stone-900 shadow-2xl" />
        <span className="absolute -bottom-2 right-6 grid size-9 place-items-center rounded-full border border-white/15 bg-background/80 text-primary shadow-lg backdrop-blur">
          <Lock className="size-4" />
        </span>
      </div>
    </div>
  );
}

/** Decorative "secure vault" graphic (pure CSS + icon, no assets). */
function Vault({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative grid size-40 place-items-center">
        {/* Glow. */}
        <div className="absolute -inset-4 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative grid size-36 place-items-center rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 shadow-2xl">
          <div className="absolute inset-3 rounded-2xl border border-white/5" />
          <Lock className="size-14 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
          {/* Dial. */}
          <span className="absolute bottom-4 right-4 size-3 rounded-full bg-primary/70" />
        </div>
        <span className="absolute -bottom-1 -right-1 grid size-10 place-items-center rounded-full border border-white/15 bg-background/80 text-primary shadow-lg backdrop-blur">
          <ShieldCheck className="size-5" />
        </span>
      </div>
    </div>
  );
}
