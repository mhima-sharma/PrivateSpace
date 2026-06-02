"use client";

import * as React from "react";
import { eventConfig } from "@/config/event";

function nextOccurrence(iso: string): Date {
  const base = new Date(iso);
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    base.getMonth(),
    base.getDate(),
    0,
    0,
    0,
  );
  if (target.getTime() < now.getTime()) target.setFullYear(now.getFullYear() + 1);
  return target;
}

function diffParts(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

export function Countdown({ date }: { date?: string }) {
  // Avoid hydration mismatch: compute on the client only.
  const [mounted, setMounted] = React.useState(false);
  const target = React.useMemo(
    () => nextOccurrence(date ?? eventConfig.birthdayDate),
    [date],
  );
  const [parts, setParts] = React.useState(() => diffParts(target));

  React.useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setParts(diffParts(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  const isToday = mounted && parts.days === 0 && target.toDateString() === new Date().toDateString();

  const units: { label: string; value: number }[] = [
    { label: "Days", value: parts.days },
    { label: "Hours", value: parts.hours },
    { label: "Minutes", value: parts.minutes },
    { label: "Seconds", value: parts.seconds },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {isToday ? (
        <p className="text-lg font-medium text-primary">🎉 It&apos;s today! 🎉</p>
      ) : (
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Counting down to the big day
        </p>
      )}
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {units.map((u) => (
          <div
            key={u.label}
            className="flex min-w-[68px] flex-col items-center rounded-xl border border-border bg-card/70 px-3 py-4 shadow-sm sm:min-w-[88px]"
          >
            <span className="font-display text-3xl font-semibold tabular-nums text-primary sm:text-4xl">
              {mounted ? String(u.value).padStart(2, "0") : "--"}
            </span>
            <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
