import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Contact", path: "/contact" });

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-heading text-3xl font-extrabold">Contact Us</h1>
      <div className="prose prose-zinc dark:prose-invert mt-6">
        <p>Have a question, a story tip, or a partnership idea? We'd love to hear from you.</p>
        <p className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <a href="mailto:hello@trendtales.com">hello@trendtales.com</a>
        </p>
      </div>
    </div>
  );
}
