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

/**
 * The single account allowed to publish/edit the shared "Updates" (event
 * details) shown to everyone. This is intentionally a fixed email rather than a
 * role: only this person can publish; everyone else sees it read-only.
 */
export const PUBLISHER_EMAIL = "ourpersonalspace0510@gmail.com";

/** True when the given email is the designated publisher. */
export function isPublisher(email?: string | null): boolean {
  return !!email && email.toLowerCase() === PUBLISHER_EMAIL;
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

/** Throw 401/403 unless signed in as the designated publisher. */
export async function requirePublisher(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isPublisher(user.email))
    throw new HttpError(403, "Only the publisher can do this");
  return user;
}
