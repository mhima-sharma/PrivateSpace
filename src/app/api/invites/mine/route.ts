import { handler } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { pendingInvitesForUser } from "@/lib/invites";

// Pending invitations addressed to the signed-in user. An already-registered
// user accepts/rejects these in-app (they cannot re-register via the link).
export const GET = handler(async () => {
  const user = await requireUser();
  const invites = await pendingInvitesForUser(user);
  return Response.json({ invites });
});
