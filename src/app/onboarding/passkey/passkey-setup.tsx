"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PasskeySetup({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function enrol() {
    setError(null);
    setBusy(true);
    try {
      const optRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
      });
      if (!optRes.ok) throw new Error("Could not start passkey setup.");
      const options = await optRes.json();

      const attestation = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });
      if (!verifyRes.ok) throw new Error("Passkey registration failed.");

      setDone(true);
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 800);
    } catch (err) {
      // User cancelling the native prompt also lands here — treat gently.
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Setup was cancelled."
          : err instanceof Error
            ? err.message
            : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 flex flex-col gap-3">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {done ? (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          Passkey added. Redirecting…
        </p>
      ) : (
        <>
          <Button size="lg" onClick={enrol} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Fingerprint />}
            Enable passkey
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(redirectTo)}
            disabled={busy}
          >
            Skip for now
          </Button>
        </>
      )}
    </div>
  );
}
