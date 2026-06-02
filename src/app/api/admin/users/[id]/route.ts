import { handler, assertSameOrigin } from "@/lib/api";
import { requireAdmin, HttpError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { idParamSchema } from "@/lib/validation";
import { audit, auditCtxFromRequest } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

// Update a user's role or active status. Admins cannot lock themselves out.
export const PATCH = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
  const { id } = idParamSchema.parse(await ctx.params);
  const body = await req.json().catch(() => null);
  const patch = patchSchema.parse(body);

  if (id === admin.id && (patch.role === "USER" || patch.isActive === false)) {
    throw new HttpError(400, "You cannot demote or deactivate yourself.");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, "Not found");

  const updated = await prisma.user.update({
    where: { id },
    data: patch,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      webauthnEnabled: true,
    },
  });

  await audit({
    userId: admin.id,
    action: "admin.user_update",
    targetType: "user",
    targetId: id,
    metadata: patch,
    ctx: auditCtxFromRequest(req),
  });

  return Response.json({ user: updated });
});
