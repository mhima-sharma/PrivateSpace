"use client";

import * as React from "react";
import { Download, X, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  canPromptInstall,
  initInstallCapture,
  subscribe,
  triggerInstall,
} from "@/lib/pwa-install";

const HIDE_KEY = "ps-install-hidden";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

/**
 * "Install app" card shown on the dashboard. It's always visible (until the app
 * is installed or dismissed for the session). When the browser supports a
 * programmatic install, "Install now" does it in one tap; otherwise it reveals
 * short platform-specific steps (e.g. iOS has no one-tap install API).
 */
export function InstallPrompt() {
  const [installed, setInstalled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [ready, setReady] = React.useState(false); // native prompt available
  const [showHelp, setShowHelp] = React.useState(false);
  const [platform, setPlatform] = React.useState<Platform>("desktop");

  React.useEffect(() => {
    initInstallCapture();
    setPlatform(detectPlatform());

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    try {
      if (sessionStorage.getItem(HIDE_KEY) === "1") setHidden(true);
    } catch {
      /* ignore */
    }

    setReady(canPromptInstall());
    const unsub = subscribe(() => setReady(canPromptInstall()));
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      unsub();
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || hidden) return null;

  async function onInstall() {
    const outcome = await triggerInstall();
    if (outcome === "accepted") setInstalled(true);
    else if (outcome === "unavailable") setShowHelp((v) => !v);
  }

  function dismiss() {
    setHidden(true);
    try {
      sessionStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  const subtitle = ready
    ? "Install it in one tap for a fast, full-screen, app-like experience."
    : platform === "ios"
      ? "Add it to your Home Screen for a full-screen, app-like experience."
      : "Add it to your device for a fast, full-screen, app-like experience.";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-0 top-0 grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:static sm:order-last"
        >
          <X className="size-4" />
        </button>

        <span className="grid size-12 shrink-0 place-items-center rounded-2xl ring-brand p-[3px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt="PrivateSpace"
            className="size-full rounded-[0.85rem]"
          />
        </span>

        <div className="min-w-0 flex-1 pr-8 sm:pr-0">
          <p className="text-sm font-semibold">Install PrivateSpace</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            className="rounded-full"
            onClick={onInstall}
          >
            <Download className="size-4" />
            Install now
          </Button>
        </div>
      </div>

      {showHelp && !ready && (
        <InstallHelp platform={platform} />
      )}
    </div>
  );
}

function InstallHelp({ platform }: { platform: Platform }) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
      {platform === "ios" ? (
        <p className="flex flex-wrap items-center gap-1.5">
          Tap
          <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5 font-medium text-foreground">
            <Share className="size-3.5" /> Share
          </span>
          then
          <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5 font-medium text-foreground">
            <Plus className="size-3.5" /> Add to Home Screen
          </span>
        </p>
      ) : (
        <p className="flex flex-wrap items-center gap-1.5">
          Open your browser menu
          <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5 font-medium text-foreground">
            <MoreVertical className="size-3.5" /> menu
          </span>
          then choose
          <span className="rounded-md bg-background px-1.5 py-0.5 font-medium text-foreground">
            Install app
          </span>
          (or the install icon in the address bar).
        </p>
      )}
    </div>
  );
}
