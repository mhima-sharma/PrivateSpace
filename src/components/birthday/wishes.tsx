import { Quote } from "lucide-react";
import { eventConfig } from "@/config/event";
import { Card, CardContent } from "@/components/ui/card";

export function Wishes() {
  return (
    <section className="container py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Birthday wishes
        </h2>
        <p className="mt-3 text-muted-foreground">
          Words from the people who love you most.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {eventConfig.wishes.map((w) => (
          <Card key={w.from} className="relative overflow-hidden">
            <CardContent className="flex h-full flex-col gap-4 p-6">
              <Quote className="size-7 text-primary/30" />
              <p className="flex-1 text-pretty leading-relaxed text-foreground/90">
                {w.message}
              </p>
              <p className="text-sm font-medium text-primary">— {w.from}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
