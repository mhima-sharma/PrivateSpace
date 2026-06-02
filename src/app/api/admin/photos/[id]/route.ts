import { handler, assertSameOrigin } from "@/lib/api";
import { requireAdmin, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { audit, auditCtxFromRequest } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({ isHidden: z.boolean() });

// Moderate a photo: hide or unhide (soft moderation, keeps the row + bytes).
export const PATCH = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
  const { id } = idParamSchema.parse(await ctx.params);
  const { isHidden } = patchSchema.parse(await req.json().catch(() => null));

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) throw new HttpError(404, "Not found");

  await prisma.photo.update({ where: { id }, data: { isHidden } });

  await audit({
    userId: admin.id,
    action: "admin.photo_moderate",
    targetType: "photo",
    targetId: id,
    metadata: { isHidden },
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ ok: true, isHidden });
});
