import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Edge middleware enforcing the `authorized` callback in auth.config.ts on
 * every matched route. This is the gate that makes the entire app invite-only:
 * unauthenticated users are bounced to /login before any private page or API
 * handler executes.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything EXCEPT static assets and the public PWA files (manifest,
  // service worker, offline page) — the browser fetches the manifest/SW WITHOUT
  // credentials, so they must not be gated behind auth or they'd redirect to
  // the login HTML. We still protect /api/images via its own session check.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|manifest.webmanifest|sw.js|offline.html|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
