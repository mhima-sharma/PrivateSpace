"use client";

import * as React from "react";
import { Mail, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Lets a prospective member ask for an invitation — for free, with no backend
 * or email provider. Submitting opens the visitor's own mail app (or WhatsApp)
 * with a pre-filled message to the admin; they just press send.
 */

// Where invite requests are sent. Change these to update the destinations.
const REQUEST_EMAIL = "ourpersnolspace0510@gmail.com";
// WhatsApp number in international format, digits only (e.g. 91 = India).
const REQUEST_WHATSAPP = "917988543400";

export function RequestInviteForm() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /** Validate, then build the shared "subject" + "body" text. Null if invalid. */
  function buildMessage(): { subject: string; body: string } | null {
    if (!name.trim() || !email.trim()) {
      setError("Please add your name and email.");
      return null;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return null;
    }
    setError(null);

    const subject = `Invite request — ${name.trim()}`;
    const body = [
      "Hi, I'd like to join PrivateSpace.",
      "",
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      message.trim() ? `Message: ${message.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return { subject, body };
  }

  function sendEmail() {
    const msg = buildMessage();
    if (!msg) return;
    // Opens the visitor's email app with everything pre-filled.
    window.location.href = `mailto:${REQUEST_EMAIL}?subject=${encodeURIComponent(
      msg.subject,
    )}&body=${encodeURIComponent(msg.body)}`;
    setSent(true);
  }

  function sendWhatsApp() {
    const msg = buildMessage();
    if (!msg) return;
    const text = `${msg.subject}\n\n${msg.body}`;
    // Opens WhatsApp (app or web) with the message pre-filled to the admin.
    window.open(
      `https://wa.me/${REQUEST_WHATSAPP}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSent(true);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-medium text-primary hover:underline"
      >
        Request an invite
      </button>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4 text-left">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Request an invite</p>
        <p className="text-xs text-muted-foreground">
          Tell us a little about you, then send via email or WhatsApp — it opens
          pre-filled, just press send.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ri-name">Your name</Label>
        <Input
          id="ri-name"
          value={name}
          maxLength={80}
          placeholder="Jane Doe"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ri-email">Your email</Label>
        <Input
          id="ri-email"
          type="email"
          value={email}
          maxLength={254}
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ri-message">Message (optional)</Label>
        <textarea
          id="ri-message"
          value={message}
          maxLength={500}
          rows={3}
          placeholder="Why you'd like to join…"
          onChange={(e) => setMessage(e.target.value)}
          className="flex w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {sent && (
        <p className="flex items-center gap-1.5 text-xs text-primary">
          <Check className="size-3.5" /> Email or WhatsApp should have opened —
          press send to finish.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant="outline" size="sm" onClick={sendWhatsApp}>
          <MessageCircle className="size-4" />
          WhatsApp
        </Button>
        <Button size="sm" onClick={sendEmail}>
          <Mail className="size-4" />
          Email
        </Button>
      </div>
    </div>
  );
}
