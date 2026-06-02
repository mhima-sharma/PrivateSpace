import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "user.register"
  | "user.login"
  | "user.login_failed"
  | "user.logout"
  | "user.webauthn_register"
  | "user.webauthn_login"
  | "invite.create"
  | "invite.revoke"
  | "invite.accept"
  | "invite.reject"
  | "invite.send"
  | "photo.upload"
  | "photo.delete"
  | "photo.like"
  | "photo.unlike"
  | "comment.create"
  | "comment.delete"
  | "profile.update"
  | "admin.user_update"
  | "admin.settings_update"
  | "admin.photo_moderate"
  | "event.create"
  | "event.delete"
  | "image.access_denied";

export interface AuditContext {
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Append an immutable audit record. Audit writes must never break the primary
 * request, so failures are swallowed and logged (best-effort durability).
 */
export async function audit(params: {
  userId?: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ctx?: AuditContext;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        ip: params.ctx?.ip ?? null,
        userAgent: params.ctx?.userAgent ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}

/** Extract request context (IP + UA) for audit logging from a Request. */
export function auditCtxFromRequest(req: Request): AuditContext {
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  return { ip, userAgent: h.get("user-agent") };
}
