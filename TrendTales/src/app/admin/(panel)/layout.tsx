import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar userName={session.user.name ?? session.user.email} />
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
    </div>
  );
}
