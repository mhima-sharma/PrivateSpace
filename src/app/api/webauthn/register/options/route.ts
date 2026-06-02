import { handler, assertSameOrigin } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { startPasskeyRegistration } from "@/lib/webauthn";

// Step 4 (opt-in): issue passkey registration options for the logged-in user.
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const options = await startPasskeyRegistration(user.id, user.email);
  return Response.json(options);
});
