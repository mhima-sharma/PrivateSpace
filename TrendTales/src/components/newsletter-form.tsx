"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/actions/newsletter.actions";

export function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await subscribeNewsletter(email);
      if (res.ok) {
        toast.success("Subscribed! Thanks for joining TrendTales.");
        setEmail("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email address"
      />
      <Button type="submit" variant="brand" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Subscribe
      </Button>
    </form>
  );
}
