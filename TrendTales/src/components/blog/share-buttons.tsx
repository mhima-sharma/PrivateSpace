"use client";

import * as React from "react";
import { Facebook, Twitter, Linkedin, Link2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = React.useState(false);
  const enc = encodeURIComponent;

  const links = [
    { label: "Share on Twitter", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { label: "Share on Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "Share on LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
      {links.map((l) => (
        <Button key={l.label} asChild variant="outline" size="icon" aria-label={l.label}>
          <a href={l.href} target="_blank" rel="noopener noreferrer">
            <l.icon className="h-4 w-4" />
          </a>
        </Button>
      ))}
      <Button variant="outline" size="icon" aria-label="Copy link" onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
