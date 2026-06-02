import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-guard";
import { AppNav } from "@/components/app-nav";
import { BottomNav } from "@/components/bottom-nav";

// Profile pages share the same chrome as the dashboard (top nav + mobile tabs).
export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <AppNav user={user} />
      {children}
      <Suspense fallback={null}>
        <BottomNav user={user} />
      </Suspense>
    </div>
  );
}
