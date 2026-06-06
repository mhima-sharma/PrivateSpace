import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({ title: "Privacy Policy", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-heading text-3xl font-extrabold">Privacy Policy</h1>
      <div className="prose prose-zinc dark:prose-invert mt-6">
        <p>Last updated: {new Date().getFullYear()}</p>
        <h2>Information we collect</h2>
        <p>
          {SITE.name} collects the email address you provide when subscribing to our
          newsletter, and anonymous analytics such as page views and affiliate link clicks.
        </p>
        <h2>How we use it</h2>
        <p>
          We use your email solely to send you our newsletter. You can unsubscribe at any
          time. Analytics help us understand what content is useful.
        </p>
        <h2>Affiliate links</h2>
        <p>
          Some links on this site are affiliate links. We may earn a commission on qualifying
          purchases at no additional cost to you.
        </p>
        <h2>Contact</h2>
        <p>Questions? Email us at hello@trendtales.com.</p>
      </div>
    </div>
  );
}
