/**
 * CLI to mint an invite without the admin UI.
 *   npm run create-invite -- guest@example.com USER
 *   npm run create-invite -- newadmin@example.com ADMIN
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const [email, roleArg] = process.argv.slice(2);
  if (!email) {
    console.error("Usage: npm run create-invite -- <email> [USER|ADMIN]");
    process.exit(1);
  }
  const role = roleArg === "ADMIN" ? "ADMIN" : "USER";

  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  const ttlHours = Number(process.env.INVITE_TTL_HOURS ?? 72);

  await prisma.invite.create({
    data: {
      token: hash,
      email: email.toLowerCase(),
      role,
      expiresAt: new Date(Date.now() + ttlHours * 3_600_000),
    },
  });

  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  console.log(`\nInvite for ${email} (${role}):`);
  console.log(`${base}/invite/${raw}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
