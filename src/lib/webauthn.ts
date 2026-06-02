import { randomBytes } from "node:crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const RP_ID = env.WEBAUTHN_RP_ID;
const RP_NAME = env.WEBAUTHN_RP_NAME;
const ORIGIN = env.WEBAUTHN_RP_ORIGIN;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// ── Challenge persistence (DB-backed, single-use, short-lived) ─────────────

async function saveChallenge(key: string, challenge: string) {
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await prisma.webAuthnChallenge.upsert({
    where: { key },
    create: { key, challenge, expiresAt },
    update: { challenge, expiresAt },
  });
}

async function takeChallenge(key: string): Promise<string | null> {
  const row = await prisma.webAuthnChallenge.findUnique({ where: { key } });
  if (!row) return null;
  // Single-use: delete on read.
  await prisma.webAuthnChallenge.delete({ where: { key } }).catch(() => {});
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row.challenge;
}

function newFlowId(): string {
  return randomBytes(24).toString("base64url");
}

// ── Registration (logged-in user opting into a passkey) ────────────────────

export async function startPasskeyRegistration(userId: string, email: string) {
  const existing = await prisma.authenticator.findMany({ where: { userId } });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: email,
    userDisplayName: email,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: c.transports
        ? (JSON.parse(c.transports) as never)
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await saveChallenge(`reg:${userId}`, options.challenge);
  return options;
}

export async function finishPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
): Promise<boolean> {
  const expectedChallenge = await takeChallenge(`reg:${userId}`);
  if (!expectedChallenge) return false;

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });
  } catch {
    return false;
  }

  if (!verification.verified || !verification.registrationInfo) return false;
  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  await prisma.$transaction([
    prisma.authenticator.create({
      data: {
        userId,
        credentialId: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        credentialDeviceType,
        credentialBackedUp,
        transports: credential.transports
          ? JSON.stringify(credential.transports)
          : null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { webauthnEnabled: true },
    }),
  ]);

  return true;
}

// ── Authentication (usernameless / discoverable credential login) ──────────

export async function startPasskeyAuthentication() {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
    // Empty allowCredentials => rely on discoverable credentials (passkeys).
    allowCredentials: [],
  });

  const flowId = newFlowId();
  await saveChallenge(`auth:${flowId}`, options.challenge);
  return { flowId, options };
}

/**
 * Verify an authentication assertion for a given flow. Returns the user id on
 * success, or null. Used by the "passkey" Auth.js credentials provider.
 */
export async function finishPasskeyAuthentication(
  flowId: string,
  response: AuthenticationResponseJSON,
): Promise<{ userId: string } | null> {
  const expectedChallenge = await takeChallenge(`auth:${flowId}`);
  if (!expectedChallenge) return null;

  const authenticator = await prisma.authenticator.findUnique({
    where: { credentialId: response.id },
  });
  if (!authenticator) return null;

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
      credential: {
        id: authenticator.credentialId,
        publicKey: new Uint8Array(authenticator.credentialPublicKey),
        counter: Number(authenticator.counter),
        transports: authenticator.transports
          ? (JSON.parse(authenticator.transports) as never)
          : undefined,
      },
    });
  } catch {
    return null;
  }

  if (!verification.verified) return null;

  // Update the signature counter to mitigate cloned-authenticator replay.
  await prisma.authenticator.update({
    where: { id: authenticator.id },
    data: { counter: BigInt(verification.authenticationInfo.newCounter) },
  });

  return { userId: authenticator.userId };
}
