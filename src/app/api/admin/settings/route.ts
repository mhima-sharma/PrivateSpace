import { handler, assertSameOrigin } from "@/lib/api";
import { requirePublisher } from "@/lib/auth-guard";
import {
  getEventSettings,
  updateEventSettings,
  updateSettingsSchema,
} from "@/lib/settings";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// Read current event settings (occasion, note, celebrant, date).
// Editing is restricted to the designated publisher.
export const GET = handler(async () => {
  await requirePublisher();
  return Response.json({ settings: await getEventSettings() });
});

// Update (publish) event settings — publisher only.
export const PUT = handler(async (req) => {
  assertSameOrigin(req);
  const admin = await requirePublisher();
  const patch = updateSettingsSchema.parse(await req.json().catch(() => null));

  const settings = await updateEventSettings(patch);

  await audit({
    userId: admin.id,
    action: "admin.settings_update",
    targetType: "settings",
    metadata: patch,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ settings });
});
