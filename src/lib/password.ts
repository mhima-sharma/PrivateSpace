import argon2 from "argon2";

/**
 * Argon2id password hashing. Parameters chosen for a good security/latency
 * balance on serverless (tune memoryCost upward if your runtime allows).
 *
 * Argon2id is the OWASP-recommended default: resistant to both GPU cracking
 * and side-channel attacks.
 */
const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, HASH_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // Malformed hash, etc. Treat as a failed verification, never throw to caller.
    return false;
  }
}
