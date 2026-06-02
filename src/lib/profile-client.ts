import type { ProfileDTO } from "@/lib/serialize";
import type { ProfileInput } from "@/lib/validation";

export type { ProfileDTO };

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Fetch a member's public profile. */
export async function fetchProfile(userId: string) {
  return asJson<{ profile: ProfileDTO }>(
    await fetch(`/api/users/${userId}/profile`, { cache: "no-store" }),
  );
}

/** Update the signed-in user's own profile (name + bio). */
export async function updateProfile(input: ProfileInput) {
  return asJson<{ profile: ProfileDTO }>(
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}
