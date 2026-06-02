import { handler, assertSameOrigin } from "@/lib/api";
import { startPasskeyAuthentication } from "@/lib/webauthn";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { HttpError } from "@/lib/auth-guard";

/**
 * Public endpoint: issue passkey authentication options (usernameless).
 * Returns a single-use flowId the client passes back when signing in.
 */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const rl = await rateLimit(`pk-auth:${clientIp(req)}`, 20, 60);
  if (!rl.success) throw new HttpError(429, "Too many attempts. Try again shortly.");

  const { flowId, options } = await startPasskeyAuthentication();
  return Response.json({ flowId, options });
});
