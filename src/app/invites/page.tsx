import { MailPlus } from "lucide-react";
import { InvitesPanel } from "@/components/invites/invites-section";

export default function InvitesPage() {
  return (
    <div className="pb-24">
      <section className="container py-8 sm:py-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
              <MailPlus className="size-5 text-primary" />
              Invitations
            </h1>
            <p className="text-sm text-muted-foreground">
              People who invited you to share their space. Accept to join and see
              each other&apos;s posts, or reject to decline.
            </p>
          </div>
          <InvitesPanel />
        </div>
      </section>
    </div>
  );
}
