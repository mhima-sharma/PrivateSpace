import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge middleware using the lightweight (provider-less) auth config.
// The `authorized` callback in authConfig gates the /admin area.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protect everything under /admin EXCEPT the login route and Next internals.
  matcher: ["/admin/:path*"],
};
