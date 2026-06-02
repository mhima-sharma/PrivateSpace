"use client";

/**
 * Captures the browser's `beforeinstallprompt` event as early as possible and
 * exposes it to React. The event can fire before any component mounts, so we
 * attach the listener at module load (during hydration) and cache the deferred
 * prompt — otherwise a one-tap install button would frequently have nothing to
 * fire.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function initInstallCapture() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // suppress the default mini-infobar; we show our own UI
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

export function canPromptInstall() {
  return deferred !== null;
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

export async function triggerInstall(): Promise<InstallOutcome> {
  if (!deferred) return "unavailable";
  await deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null;
  emit();
  return choice.outcome;
}

// Attach the capture as soon as this module is first imported on the client.
initInstallCapture();
