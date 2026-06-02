"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Sun, Moon, Monitor, LogOut, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/**
 * Profile → Settings sheet. Currently exposes appearance (light/dark/system)
 * and sign-out. Self-only — rendered from the profile owner's own page.
 */
export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [signingOut, setSigningOut] = React.useState(false);

  return (
    <Modal
      open={open}
      onClose={() => !signingOut && onClose()}
      title="Settings"
      className="max-w-sm"
    >
      <div className="flex flex-col gap-6">
        {/* Appearance */}
        <section className="flex flex-col gap-2.5">
          <h3 className="text-sm font-semibold">Appearance</h3>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => {
              const active = mounted && theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Account */}
        <section className="flex flex-col gap-2.5 border-t border-border/70 pt-4">
          <h3 className="text-sm font-semibold">Account</h3>
          <Button
            variant="destructive"
            className="w-full justify-center"
            onClick={() => {
              setSigningOut(true);
              signOut({ callbackUrl: "/login" });
            }}
            disabled={signingOut}
          >
            {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
            Sign out
          </Button>
        </section>
      </div>
    </Modal>
  );
}
