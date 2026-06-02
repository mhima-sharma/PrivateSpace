import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/auth-guard";

/**
 * Outbound email over SMTP (e.g. Gmail App Password). Email is OPTIONAL infra:
 * if SMTP isn't configured we throw a clear 503 rather than crash, so the rest
 * of the app works without it.
 */

export function isMailConfigured(): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

let cached: nodemailer.Transporter | null = null;

function transport(): nodemailer.Transporter {
  if (!isMailConfigured()) {
    throw new HttpError(
      503,
      "Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.",
    );
  }
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return cached;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Send an invitation link to the recipient. Throws HttpError on failure. */
export async function sendInviteEmail(params: {
  to: string;
  url: string;
  role: "USER" | "ADMIN";
  expiresAt: Date;
}): Promise<void> {
  const { to, url, expiresAt } = params;
  const from = env.MAIL_FROM || env.SMTP_USER!;
  const safeUrl = escapeHtml(url);
  const expires = expiresAt.toLocaleString();

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="margin:0 0 12px">You're invited to PrivateSpace</h2>
      <p style="margin:0 0 16px;color:#555">
        You've been invited to join a private, members-only space. Use the link
        below to set up your account. This link is one-time and expires on
        <strong>${escapeHtml(expires)}</strong>.
      </p>
      <p style="margin:0 0 24px">
        <a href="${safeUrl}" style="display:inline-block;background:#e0701a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Accept invitation
        </a>
      </p>
      <p style="margin:0 0 6px;color:#888;font-size:13px">Or paste this link into your browser:</p>
      <p style="margin:0;word-break:break-all;font-size:13px"><a href="${safeUrl}" style="color:#e0701a">${safeUrl}</a></p>
    </div>`;

  const text = `You're invited to PrivateSpace.

Set up your account with this one-time link (expires ${expires}):
${url}`;

  try {
    await transport().sendMail({
      from,
      to,
      subject: "Your invitation to PrivateSpace",
      text,
      html,
    });
  } catch (err) {
    console.error("[mailer] send failed", err);
    throw new HttpError(502, "Could not send the email. Check SMTP settings.");
  }
}
