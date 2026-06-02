export interface PendingInviteDTO {
  id: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  expiresAt: string;
  inviter: { id: string; name: string | null; email: string } | null;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchMyInvites() {
  return asJson<{ invites: PendingInviteDTO[] }>(
    await fetch("/api/invites/mine", { cache: "no-store" }),
  );
}

export async function respondToInvite(id: string, action: "accept" | "reject") {
  return asJson<{ ok: true }>(
    await fetch(`/api/invites/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }),
  );
}
