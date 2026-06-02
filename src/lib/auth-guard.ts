import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  webauthnEnabled: boolean;
}

/**
 * Resolve the current session user for use inside API route handlers and
 * server components. Returns null when unauthenticated.
 *
 * Even though middleware already gates private routes, every API handler
 * re-checks the session here (defence in depth — never trust the gate alone).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: session.user.role,
    webauthnEnabled: session.user.webauthnEnabled,
  };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Throw 401 if not signed in; returns the user otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Authentication required");
  return user;
}

/** Throw 401/403 unless signed in as an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new HttpError(403, "Admin access required");
  return user;
}
