import { AdminConsole } from "@/components/admin/admin-console";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Console
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage invitations, members and review activity.
        </p>
      </div>
      <AdminConsole />
    </div>
  );
}
