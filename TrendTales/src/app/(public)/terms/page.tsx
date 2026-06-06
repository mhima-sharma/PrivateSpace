import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({ title: "Terms of Service", path: "/terms" });

export default function TermsPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-heading text-3xl font-extrabold">Terms of Service</h1>
      <div className="prose prose-zinc dark:prose-invert mt-6">
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>
          By accessing {SITE.name}, you agree to these terms. All content is provided for
          informational purposes only and is the property of {SITE.name} unless otherwise stated.
        </p>
        <h2>Use of content</h2>
        <p>
          You may not reproduce, distribute, or create derivative works from our content without
          permission.
        </p>
        <h2>Affiliate disclosure</h2>
        <p>
          {SITE.name} participates in affiliate programs. Product prices and availability are
          accurate as of the date/time indicated and are subject to change.
        </p>
        <h2>Limitation of liability</h2>
        <p>
          {SITE.name} is not liable for any decisions made based on the information provided on
          this site.
        </p>
      </div>
    </div>
  );
}
