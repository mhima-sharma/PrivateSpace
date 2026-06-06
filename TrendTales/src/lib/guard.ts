import { auth } from "@/lib/auth";

/**
 * Ensures the current request is an authenticated admin.
 * Throws when not — call inside server actions / route handlers that mutate data.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
