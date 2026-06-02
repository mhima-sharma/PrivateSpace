import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth-guard";
import { finishPasskeyRegistration } from "@/lib/webauthn";
import { audit, auditCtxFromRequest } from "@/lib/audit";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const body = (await req.json().catch(() => null)) as RegistrationResponseJSON | null;
  if (!body) throw new HttpError(400, "Missing attestation response");

  const ok = await finishPasskeyRegistration(user.id, body);
  if (!ok) throw new HttpError(400, "Passkey registration failed");

  await audit({
    userId: user.id,
    action: "user.webauthn_register",
    ctx: auditCtxFromRequest(req),
  });
  return Response.json({ ok: true });
});
