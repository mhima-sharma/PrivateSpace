import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { generateInviteToken, hashToken } from "@/lib/tokens";
import type { Role } from "@prisma/client";

/**
 * Create an invite for `email`. Returns the RAW token (to be embedded in the
 * link sent to the recipient). Only the hash is persisted.
 */
export async function createInvite(params: {
  email: string;
  role: Role;
  createdById: string;
}): Promise<{ raw: string; id: string; expiresAt: Date }> {
  const { raw, hash } = generateInviteToken();
  const expiresAt = new Date(
    Date.now() + env.INVITE_TTL_HOURS * 60 * 60 * 1000,
  );

  const invite = await prisma.invite.create({
    data: {
      token: hash,
      email: params.email,
      role: params.role,
      createdById: params.createdById,
      expiresAt,
    },
  });

  return { raw, id: invite.id, expiresAt };
}

/** Build the absolute invite URL for the raw token. */
export function inviteUrl(raw: string): string {
  return `${env.NEXTAUTH_URL.replace(/\/$/, "")}/invite/${raw}`;
}

export type InviteValidation =
  | { ok: true; invite: { id: string; email: string; role: Role } }
  | { ok: false; reason: "not_found" | "used" | "expired" };

/** Look up and validate a raw invite token without consuming it. */
export async function validateInvite(raw: string): Promise<InviteValidation> {
  const hash = hashToken(raw);
  const invite = await prisma.invite.findUnique({ where: { token: hash } });
  if (!invite) return { ok: false, reason: "not_found" };
  if (invite.used) return { ok: false, reason: "used" };
  if (invite.expiresAt.getTime() < Date.now())
    return { ok: false, reason: "expired" };
  return {
    ok: true,
    invite: { id: invite.id, email: invite.email, role: invite.role },
  };
}
