import Link from "next/link";
import { Brand } from "@/components/brand";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

// Landing for users without a full invite link in the URL.
export default function InviteInfoPage() {
  return (
    <main className="bg-mesh flex min-h-dvh flex-col">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-1">
          <BackButton fallbackHref="/login" />
          <Brand />
        </div>
        <ThemeToggle />
      </header>
      <div className="container flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Invitation required
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Access to PrivateSpace is by invitation only. Open the secure link
              from your invitation to create your account. If you already have
              an account, sign in instead.
            </p>
            <Link href="/login" className={buttonVariants({ className: "mt-6 w-full" })}>
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
