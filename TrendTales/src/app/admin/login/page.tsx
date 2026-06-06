import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin Login — TrendTales", robots: { index: false } };

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="font-heading text-2xl font-extrabold">
            <span className="text-gradient">TrendTales</span> Admin
          </h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your content</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
