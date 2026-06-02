import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Brand } from "@/components/brand";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";
import { Card, CardContent } from "@/components/ui/card";

// Generic, company-style sign-in. NOTHING here hints at the event behind it.
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="bg-mesh relative flex min-h-dvh flex-col">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-1">
          <BackButton />
          <Brand />
        </div>
        <ThemeToggle />
      </header>

      <div className="container flex flex-1 items-center justify-center py-10">
        <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
          {/* Left: generic marketing copy */}
          <section className="hidden flex-col gap-6 lg:flex animate-fade-up">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Private members area
            </span>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Your secure,
              <br />
              members-only space.
            </h1>
            <p className="max-w-md text-muted-foreground">
              PrivateSpace is an invite-only platform. Access is restricted to
              members. Please sign in with the credentials provided in your
              invitation.
            </p>
            <ul className="grid gap-3 text-sm text-muted-foreground">
              {[
                "Invite-only, encrypted access",
                "Passwordless sign-in with passkeys",
                "End-to-end private content",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </section>

          {/* Right: sign-in card */}
          <section className="w-full animate-fade-up">
            <Card className="mx-auto w-full max-w-md shadow-lg">
              <CardContent className="p-7">
                <div className="mb-6 flex flex-col gap-1.5">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Sign in
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your credentials to continue.
                  </p>
                </div>
                <Suspense fallback={null}>
                  <LoginForm />
                </Suspense>
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Have an invitation link?{" "}
                  <Link
                    href="/invite"
                    className="font-medium text-primary hover:underline"
                  >
                    Create your account
                  </Link>
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <footer className="container py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PrivateSpace. All rights reserved.
      </footer>
    </main>
  );
}
