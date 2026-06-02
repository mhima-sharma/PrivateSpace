import { handler } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { listActiveEvents } from "@/lib/events";

// Active (non-expired) events for the dashboard strip. Any signed-in user.
export const GET = handler(async () => {
  await requireUser();
  return Response.json({ events: await listActiveEvents() });
});
