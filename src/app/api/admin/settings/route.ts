import { handler, assertSameOrigin } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guard";
import {
  getEventSettings,
  updateEventSettings,
  updateSettingsSchema,
} from "@/lib/settings";
import { audit, auditCtxFromRequest } from "@/lib/audit";

// Read current event settings (occasion, note, celebrant, date).
export const GET = handler(async () => {
  await requireAdmin();
  return Response.json({ settings: await getEventSettings() });
});

// Update event settings.
export const PUT = handler(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
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
