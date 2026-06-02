import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js config.
 *
 * This file MUST NOT import Prisma, argon2, or any Node-only module, because it
 * is loaded by the Edge middleware. Heavy providers and the database lookup
 * live in `src/auth.ts` (Node runtime) instead.
 *
 * The `authorized` callback here is the single source of truth for route
 * protection, consumed by middleware.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  // Providers are added in src/auth.ts (Node runtime).
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Public, unauthenticated routes. Everything else is private.
      const publicPrefixes = [
        "/login",
        "/register",
        "/invite",
        "/photos", // shared single-post links — the page does its own auth gate
        "/api/auth", // Auth.js endpoints
        "/api/register",
        "/api/webauthn", // passkey ceremonies (guarded internally)
      ];
      // Exact match or a path SEGMENT under the prefix. Note the trailing
      // slash: it stops "/invites" from matching the "/invite" prefix.
      const isPublic = publicPrefixes.some(
        (p) => pathname === p || pathname.startsWith(p + "/"),
      );

      const isAdminRoute = pathname.startsWith("/admin");

      if (isAdminRoute) {
        return isLoggedIn && auth!.user.role === "ADMIN";
      }

      if (isPublic) return true;

      // All other routes require a session.
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.webauthnEnabled = user.webauthnEnabled;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.webauthnEnabled = token.webauthnEnabled as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
