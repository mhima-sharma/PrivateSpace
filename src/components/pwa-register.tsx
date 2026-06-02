"use client";

import { useEffect } from "react";
import { initInstallCapture } from "@/lib/pwa-install";

/**
 * Registers the service worker once, after the app has loaded. Kept in a tiny
 * client component so the root layout can stay a server component.
 *
 * The current env is passed to the SW via a query param so it can stay in a
 * passthrough mode during development (no caching of un-hashed dev chunks →
 * hot-reload keeps working) while still being installable.
 */
export function PwaRegister() {
  useEffect(() => {
    // Start listening for the install prompt as early as possible.
    initInstallCapture();

    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Needs a secure context (HTTPS, or localhost which counts as secure).
    if (!window.isSecureContext) return;

    const url = `/sw.js?env=${process.env.NODE_ENV}`;
    const register = () => {
      navigator.serviceWorker.register(url).catch((err) => {
        console.error("[pwa] service worker registration failed", err);
      });
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
