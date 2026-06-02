import { Suspense } from "react";
import { Images } from "lucide-react";
import { getSessionUser } from "@/lib/auth-guard";
import { GalleryView } from "@/components/memories/gallery-view";
import { InstallPrompt } from "@/components/install-prompt";
import { EventsSection } from "@/components/events/events-section";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const displayName = user?.email?.split("@")[0] ?? null;

  return (
    <div className="pb-24">
      {/* Compact gallery header */}
      <section className="bg-mesh relative overflow-hidden border-b border-border/60">
        <div className="container flex flex-col items-center gap-1.5 py-7 text-center sm:py-9">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Images className="size-3.5" /> Private gallery
          </span>

          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
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
        </div>
      </section>

      {/* Gallery */}
      <section className="container py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <InstallPrompt />
          <EventsSection />
          <Suspense fallback={<div className="h-screen" />}>
            <GalleryView email={user?.email ?? ""} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
