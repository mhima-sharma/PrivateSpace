import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no Prisma / bcrypt imports here).
 * Used by `middleware.ts` to authorize requests at the edge, and extended
 * with the Credentials provider in `auth.ts` for the Node runtime.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    // Persist role + id onto the JWT.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // `role` is attached by the Credentials authorize() callback.
        token.role = (user as { role?: string }).role ?? "ADMIN";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    // Gate the /admin area (login page handled separately in middleware matcher).
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      // The login page must stay public to avoid a redirect loop.
      if (pathname.startsWith("/admin/login")) return true;
      if (pathname.startsWith("/admin")) {
        return isLoggedIn;
      }
      return true;
    },
  },
  providers: [], // Real providers are added in auth.ts (Node runtime).
} satisfies NextAuthConfig;
