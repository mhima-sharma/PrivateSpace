import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import { finishPasskeyAuthentication } from "@/lib/webauthn";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";

/**
 * Full Auth.js setup (Node runtime). Adds the Credentials provider with
 * Argon2 verification on top of the edge-safe `authConfig`.
 *
 * We use JWT sessions (no adapter needed for credentials) so the Edge
 * middleware can authorize requests without a DB round-trip.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
          // Run a dummy verify to keep timing roughly constant and avoid
          // user-enumeration via response time.
          await verifyPassword(
            "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$3g2sFvJj7r2sJ0H2k0n4mWZ0Q0pVxY7t8c1n2b3v4w5",
            password,
          );
          return null;
        }

        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          webauthnEnabled: user.webauthnEnabled,
        };
      },
    }),

    // Passkey / WebAuthn login. The browser runs the assertion ceremony, then
    // submits { flowId, response } here. We verify server-side and resolve the
    // user — Auth.js then issues the JWT session as usual.
    Credentials({
      id: "passkey",
      name: "Passkey",
      credentials: {
        flowId: { type: "text" },
        response: { type: "text" },
      },
      async authorize(raw) {
        const flowId = typeof raw?.flowId === "string" ? raw.flowId : null;
        const responseRaw =
          typeof raw?.response === "string" ? raw.response : null;
        if (!flowId || !responseRaw) return null;

        let assertion: AuthenticationResponseJSON;
        try {
          assertion = JSON.parse(responseRaw) as AuthenticationResponseJSON;
        } catch {
          return null;
        }

        const result = await finishPasskeyAuthentication(flowId, assertion);
        if (!result) return null;

        const user = await prisma.user.findUnique({
          where: { id: result.userId },
        });
        if (!user || !user.isActive) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          webauthnEnabled: user.webauthnEnabled,
        };
      },
    }),
  ],
});
