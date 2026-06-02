import { Pencil, Megaphone } from "lucide-react";
import { getSessionUser, isPublisher } from "@/lib/auth-guard";
import { getEventSettings } from "@/lib/settings";
import { BirthdayHero } from "@/components/birthday/hero";
import { EventPanel } from "@/components/admin/admin-console";

/**
 * Shared "Updates" page. Everyone signed in sees the published event details
 * (read-only). The designated publisher additionally gets the edit form, so
 * only they can publish — or hide — what everyone else sees.
 */
export default async function UpdatesPage() {
  const user = await getSessionUser();
  const settings = await getEventSettings();
  const canPublish = isPublisher(user?.email);
  const viewerName = user?.email?.split("@")[0] ?? null;

  return (
    <div className="pb-24">
      {/* Hero is shown only while published. The publisher still sees a preview
          of it (when live); other viewers get an empty state when hidden. */}
      {settings.published ? (
        <BirthdayHero settings={settings} viewerName={viewerName} />
      ) : (
        !canPublish && (
          <section className="container grid place-items-center py-24 text-center">
            <Megaphone className="mb-3 size-8 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Nothing published yet</h1>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              There are no updates to show right now. Check back soon.
            </p>
          </section>
        )
      )}

      {canPublish && (
        <section className="container py-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Pencil className="size-4 text-primary" />
              Publish — only you can see and edit this. Changes go live for
              everyone immediately.
            </div>
            <EventPanel />
          </div>
        </section>
      )}
    </div>
  );
}
