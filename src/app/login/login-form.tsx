"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [passkeyBusy, setPasskeyBusy] = React.useState(false);

  // Where to land after sign-in. Honour a relative callbackUrl (e.g. a shared
  // /photos/<id> link the visitor was bounced from), but never an absolute or
  // protocol-relative URL — that would be an open-redirect.
  function redirectTarget(): string {
    const cb = params.get("callbackUrl");
    if (cb && cb.startsWith("/") && !cb.startsWith("//")) return cb;
    return "/dashboard";
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await signIn("credentials", {
      ...values,
      redirect: false,
    });
    if (res?.error) {
      setServerError("Invalid email or password.");
      return;
    }
    router.push(redirectTarget());
    router.refresh();
  }

  async function onPasskey() {
    setServerError(null);
    setPasskeyBusy(true);
    try {
      const optRes = await fetch("/api/webauthn/authenticate/options", {
        method: "POST",
      });
      if (!optRes.ok) throw new Error("Could not start passkey sign-in");
      const { flowId, options } = await optRes.json();

      const assertion = await startAuthentication({ optionsJSON: options });

      const res = await signIn("passkey", {
        flowId,
        response: JSON.stringify(assertion),
        redirect: false,
      });
      if (res?.error) throw new Error("Passkey was not recognised.");
      router.push(redirectTarget());
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Passkey sign-in failed.",
      );
    } finally {
      setPasskeyBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username webauthn"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onPasskey}
        disabled={passkeyBusy}
      >
        {passkeyBusy ? <Loader2 className="animate-spin" /> : <Fingerprint />}
        Sign in with a passkey
      </Button>
    </div>
  );
}
