import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Brand } from "@/components/brand";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { PasskeySetup } from "./passkey-setup";

// Step 4 of the auth flow — optional biometric / passkey enrolment.
export default async function PasskeyOnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="bg-mesh flex min-h-dvh flex-col">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-1">
          <BackButton fallbackHref="/dashboard" />
          <Brand />
        </div>
        <ThemeToggle />
      </header>
      <div className="container flex flex-1 items-center justify-center py-10">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary text-2xl">
              ✶
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Set up fingerprint sign-in
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Add a passkey to sign in instantly with your fingerprint, face, or
              device PIN — no password needed next time. You can skip this and
              set it up later from your settings.
            </p>
            <PasskeySetup />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
