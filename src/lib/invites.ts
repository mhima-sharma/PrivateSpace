import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { isPublisher } from "@/lib/auth-guard";
import { generateInviteToken, hashToken } from "@/lib/tokens";
import type { Role } from "@prisma/client";

/**
 * The set of author user-ids whose content a viewer may see, derived purely
 * from invite relationships:
 *   - themselves,
 *   - users they invited (admin → their users),
 *   - the admin(s) who invited them (user → their admin).
 * Returns `null` for the super publisher, meaning "no restriction — sees all".
 *
 * Only ACCEPTED invites (`used: true`) establish a link. A pending or rejected
 * invite grants nothing — an existing user must explicitly accept an in-app
 * invitation before either side can see the other's content.
 */
export async function visibleAuthorIds(viewer: {
  id: string;
  email: string;
}): Promise<string[] | null> {
  if (isPublisher(viewer.email)) return null;

  const email = viewer.email.toLowerCase();
  const invites = await prisma.invite.findMany({
    where: { used: true },
    select: { email: true, createdById: true },
  });

  const invitedEmails = invites
    .filter((i) => i.createdById === viewer.id)
    .map((i) => i.email.toLowerCase());
  const inviterIds = invites
    .filter((i) => i.email.toLowerCase() === email && i.createdById)
    .map((i) => i.createdById as string);

  const ids = new Set<string>([viewer.id, ...inviterIds]);
  if (invitedEmails.length) {
    const invited = await prisma.user.findMany({
      where: { email: { in: invitedEmails } },
      select: { id: true },
    });
    for (const u of invited) ids.add(u.id);
  }
  return [...ids];
}

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

export interface PendingInviteDTO {
  id: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
  inviter: { id: string; name: string | null; email: string } | null;
}

/**
 * Pending invitations addressed to an already-registered user, surfaced inside
 * the app so they can accept (join the inviter's group) or reject. Excludes
 * accepted/rejected/expired invites and any self-invite.
 */
export async function pendingInvitesForUser(user: {
  id: string;
  email: string;
}): Promise<PendingInviteDTO[]> {
  const email = user.email.toLowerCase();
  const invites = await prisma.invite.findMany({
    where: {
      email,
      used: false,
      rejectedAt: null,
      expiresAt: { gt: new Date() },
      createdById: { not: null },
    },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return invites
    .filter((i) => i.createdById !== user.id) // never show a self-invite
    .map((i) => ({
      id: i.id,
      role: i.role,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
      inviter: i.createdBy,
    }));
}

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
