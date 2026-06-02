import { Countdown } from "@/components/birthday/countdown";
import type { EventSettings } from "@/lib/settings";

export function BirthdayHero({
  settings,
  viewerName,
}: {
  settings: EventSettings;
  viewerName?: string | null;
}) {
  return (
    <section className="bg-mesh relative overflow-hidden">
      <div className="container flex flex-col items-center gap-8 py-16 text-center md:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-up">
          ✶ {settings.occasion}
        </span>

        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight animate-fade-up sm:text-6xl md:text-7xl">
          Happy Birthday,
          <br />
          <span className="text-primary">{settings.celebrant}</span>
        </h1>

        {settings.note && (
          <p className="max-w-xl text-balance text-muted-foreground animate-fade-up">
            {viewerName ? `${viewerName}, ` : ""}
            {settings.note}
          </p>
        )}

        <div className="animate-float">
          <Countdown date={settings.birthdayDate} />
        </div>
      </div>
    </section>
  );
}
