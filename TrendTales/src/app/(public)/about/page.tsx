import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({ title: "About", path: "/about" });

export default function AboutPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-heading text-3xl font-extrabold">About {SITE.name}</h1>
      <div className="prose prose-zinc dark:prose-invert mt-6">
        <p>
          {SITE.name} — {SITE.tagline}. We are a modern publication covering Fashion,
          Travel, Technology, Lifestyle, Food and the best Deals on the internet.
        </p>
        <p>
          Our mission is to bring you trustworthy stories, hands-on guides and carefully
          curated product recommendations. When you buy through some of our links we may earn
          a small commission — at no extra cost to you — which helps keep the lights on.
        </p>
        <p>Thanks for reading, and welcome to the community.</p>
      </div>
    </div>
  );
}
