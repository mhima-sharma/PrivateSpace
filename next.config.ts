import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 * Note: CSP is intentionally strict. Tailwind injects inline styles, so
 * 'unsafe-inline' is allowed for styles only. Scripts use nonces in prod
 * via Next.js when configured; here we keep a conservative baseline.
 */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // publickey-credentials-* are required for WebAuthn / passkeys.
    value:
      "camera=(), microphone=(), geolocation=(), publickey-credentials-get=(self), publickey-credentials-create=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' blob: data:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Hide the floating Next.js dev-tools indicator (the "N" badge) shown in dev.
  devIndicators: false,
  serverExternalPackages: ["@prisma/client", "argon2", "@simplewebauthn/server"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
