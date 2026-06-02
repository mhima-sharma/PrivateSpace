import { eventConfig } from "@/config/event";

export function Timeline() {
  return (
    <section className="border-y border-border/70 bg-secondary/40">
      <div className="container py-16">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            A journey worth celebrating
          </h2>
          <p className="mt-3 text-muted-foreground">
            A few chapters in a story that keeps getting better.
          </p>
        </div>

        <ol className="relative mx-auto max-w-2xl border-l-2 border-primary/20 pl-8">
          {eventConfig.timeline.map((item, i) => (
            <li key={i} className="relative pb-10 last:pb-0">
              <span className="absolute -left-[41px] grid h-5 w-5 place-items-center rounded-full border-2 border-primary bg-background">
                <span className="h-2 w-2 rounded-full bg-primary" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {item.year}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
              <p className="mt-1 text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
