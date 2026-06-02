/**
 * Seed script — bootstraps the very first ADMIN invite so you can register the
 * initial administrator. Run with: `npm run db:seed`.
 *
 * It does NOT create a user directly (passwords go through the normal Argon2
 * registration flow). Instead it prints a ready-to-use invite link for the
 * BOOTSTRAP_ADMIN_EMAIL.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";

const prisma = new PrismaClient();

function token() {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  if (!email) {
    throw new Error("Set BOOTSTRAP_ADMIN_EMAIL in your environment first.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Admin user already exists: ${email}`);
    return;
  }

  const ttlHours = Number(process.env.INVITE_TTL_HOURS ?? 72);
  const { raw, hash } = token();
  await prisma.invite.create({
    data: {
      token: hash,
      email,
      role: "ADMIN",
      expiresAt: new Date(Date.now() + ttlHours * 3_600_000),
    },
  });

  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  console.log("\n──────────────────────────────────────────────");
  console.log("  Admin bootstrap invite created.");
  console.log(`  Email: ${email}`);
  console.log(`  Open this link to register the admin account:`);
  console.log(`\n  ${base}/invite/${raw}\n`);
  console.log("──────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
