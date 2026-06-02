import Link from "next/link";
import { Brand } from "@/components/brand";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { validateInvite } from "@/lib/invites";
import { RegisterForm } from "./register-form";

export default async function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validateInvite(token);

  return (
    <main className="bg-mesh flex min-h-dvh flex-col">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-1">
          <BackButton fallbackHref="/login" />
          <Brand />
        </div>
        <ThemeToggle />
      </header>

      <div className="container flex flex-1 items-center justify-center py-10">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-7">
            {result.ok ? (
              <>
                <div className="mb-6 flex flex-col gap-1.5">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Create your account
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve been invited as{" "}
                    <span className="font-medium text-foreground">
                      {result.invite.email}
                    </span>
                    . Set a password to continue.
                  </p>
                </div>
                <RegisterForm
                  token={token}
                  email={result.invite.email}
                />
              </>
            ) : (
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {result.reason === "used"
                    ? "Invitation already used"
                    : result.reason === "expired"
                      ? "Invitation expired"
                      : "Invalid invitation"}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {result.reason === "used"
                    ? "This invitation has already been redeemed. Try signing in."
                    : "This invitation link is no longer valid. Please request a new one from your administrator."}
                </p>
                <Link
                  href="/login"
                  className={buttonVariants({ className: "mt-6 w-full" })}
                >
                  Go to sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
