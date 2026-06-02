import Link from "next/link";
import { Brand } from "@/components/brand";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { validateInvite } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { RegisterForm } from "./register-form";

export default async function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validateInvite(token);

  // If the invited email already has an account, the link can't create a second
  // one. Send them to sign in — the invitation is waiting in their dashboard to
  // accept or reject.
  const existingAccount =
    result.ok &&
    !!(await prisma.user.findUnique({
      where: { email: result.invite.email.toLowerCase() },
      select: { id: true },
    }));

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
            {result.ok && existingAccount ? (
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  You already have an account
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {result.invite.email}
                  </span>{" "}
                  is already registered. Sign in and you&apos;ll find this
                  invitation waiting on your dashboard to accept or reject.
                </p>
                <Link
                  href="/login"
                  className={buttonVariants({ className: "mt-6 w-full" })}
                >
                  Go to sign in
                </Link>
              </div>
            ) : result.ok ? (
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
