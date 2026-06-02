"use client";

import * as React from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Copy,
  Loader2,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDateTime } from "@/lib/utils";

type Tab = "event" | "invites" | "users" | "activity";

async function j<T>(req: Response | Promise<Response>): Promise<T> {
  const res = await req;
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
  return res.json();
}

export function AdminConsole() {
  const [tab, setTab] = React.useState<Tab>("event");
  const tabs: { id: Tab; label: string }[] = [
    { id: "event", label: "Event" },
    { id: "invites", label: "Invites" },
    { id: "users", label: "Users" },
    { id: "activity", label: "Activity log" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex w-fit overflow-x-auto rounded-full border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "event" && <EventPanel />}
      {tab === "invites" && <InvitesPanel />}
      {tab === "users" && <UsersPanel />}
      {tab === "activity" && <ActivityPanel />}
    </div>
  );
}

// ── Event settings (occasion + note, editable) ──────────────────────────────
interface EventSettings {
  celebrant: string;
  occasion: string;
  note: string;
  birthdayDate: string;
}

function EventPanel() {
  const qc = useQueryClient();
  const [form, setForm] = React.useState<EventSettings | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => j<{ settings: EventSettings }>(fetch("/api/admin/settings")),
  });

  React.useEffect(() => {
    if (data?.settings && !form) setForm(data.settings);
  }, [data, form]);

  const save = useMutation({
    mutationFn: (payload: EventSettings) =>
      j<{ settings: EventSettings }>(
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ),
    onSuccess: () => {
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 1800);
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading || !form)
    return <Card><CardContent className="p-0"><Spinner /></CardContent></Card>;

  const set = (k: keyof EventSettings) => (v: string) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  // Normalise the date input (the field expects YYYY-MM-DD).
  const dateValue = form.birthdayDate.slice(0, 10);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-1 text-base font-semibold">Event details</h3>
        <p className="mb-5 text-sm text-muted-foreground">
          Edit the occasion and note shown on the private dashboard. Changes are
          live immediately.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="celebrant">Celebrant</Label>
            <Input
              id="celebrant"
              value={form.celebrant}
              maxLength={80}
              onChange={(e) => set("celebrant")(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="birthdayDate">Date</Label>
            <Input
              id="birthdayDate"
              type="date"
              value={dateValue}
              onChange={(e) => set("birthdayDate")(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="occasion">Occasion</Label>
            <Input
              id="occasion"
              value={form.occasion}
              maxLength={120}
              placeholder="e.g. A celebration of you"
              onChange={(e) => set("occasion")(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="note">Note</Label>
            <textarea
              id="note"
              value={form.note}
              maxLength={600}
              rows={4}
              placeholder="A personal message shown beneath the title…"
              onChange={(e) => set("note")(e.target.value)}
              className="flex w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Check />}
            Save changes
          </Button>
          {saved && (
            <span className="text-sm font-medium text-primary">Saved ✓</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Invites ────────────────────────────────────────────────────────────────
interface Invite {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  used: boolean;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

function InvitesPanel() {
  const qc = useQueryClient();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"USER" | "ADMIN">("USER");
  const [lastLink, setLastLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "invites"],
    queryFn: () => j<{ invites: Invite[] }>(fetch("/api/admin/invites")),
  });

  const create = useMutation({
    mutationFn: () =>
      j<{ url: string }>(
        fetch("/api/admin/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role }),
        }),
      ),
    onSuccess: (res) => {
      setLastLink(res.url);
      setEmail("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["admin", "invites"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) =>
      j(fetch(`/api/admin/invites/${id}`, { method: "DELETE" })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "invites"] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-base font-semibold">Send an invite</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="guest@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !email}>
              {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
              Create
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          {lastLink && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Share this one-time link with the invitee (shown once):
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">
                  {lastLink}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(lastLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Spinner />
          ) : (
            <Table
              head={["Email", "Role", "Status", "Expires", ""]}
              rows={(data?.invites ?? []).map((inv) => [
                inv.email,
                inv.role,
                inv.used ? (
                  <span className="text-muted-foreground">Used</span>
                ) : new Date(inv.expiresAt) < new Date() ? (
                  <span className="text-destructive">Expired</span>
                ) : (
                  <span className="text-primary">Pending</span>
                ),
                formatDateTime(inv.expiresAt),
                !inv.used && (
                  <button
                    onClick={() => revoke.mutate(inv.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Revoke"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ),
              ])}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Users ────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  webauthnEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  _count: { photos: number; comments: number };
}

function UsersPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => j<{ users: AdminUser[] }>(fetch("/api/admin/users")),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; patch: Partial<AdminUser> }) =>
      j(
        fetch(`/api/admin/users/${vars.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vars.patch),
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  if (isLoading) return <Card><CardContent className="p-0"><Spinner /></CardContent></Card>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table
          head={["User", "Role", "Photos", "Status", "Actions"]}
          rows={(data?.users ?? []).map((u) => [
            <div key="u" className="leading-tight">
              <p className="font-medium">{u.name ?? u.email.split("@")[0]}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>,
            <span
              key="role"
              className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
                u.role === "ADMIN"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {u.role === "ADMIN" && <ShieldCheck className="size-3" />}
              {u.role}
            </span>,
            u._count.photos,
            u.isActive ? (
              <span key="st" className="text-primary">Active</span>
            ) : (
              <span key="st" className="text-destructive">Disabled</span>
            ),
            <div key="a" className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update.mutate({
                    id: u.id,
                    patch: { role: u.role === "ADMIN" ? "USER" : "ADMIN" },
                  })
                }
              >
                {u.role === "ADMIN" ? "Make user" : "Make admin"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Toggle active"
                onClick={() =>
                  update.mutate({ id: u.id, patch: { isActive: !u.isActive } })
                }
              >
                {u.isActive ? <UserX /> : <UserCheck />}
              </Button>
            </div>,
          ])}
        />
      </CardContent>
    </Card>
  );
}

// ── Activity log ───────────────────────────────────────────────────────────
interface LogRow {
  id: string;
  action: string;
  targetType: string | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null } | null;
}

function ActivityPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () =>
      j<{ logs: LogRow[] }>(fetch("/api/admin/audit-logs")),
  });

  if (isLoading) return <Card><CardContent className="p-0"><Spinner /></CardContent></Card>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table
          head={["When", "Actor", "Action", "Target", "IP"]}
          rows={(data?.logs ?? []).map((l) => [
            formatDateTime(l.createdAt),
            l.user?.email ?? <span className="text-muted-foreground">system</span>,
            <code key="ac" className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {l.action}
            </code>,
            l.targetType ?? "—",
            l.ip ?? "—",
          ])}
        />
      </CardContent>
    </Card>
  );
}

// ── Shared table primitives ─────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="grid place-items-center py-16 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

function Table({
  head,
  rows,
}: {
  head: React.ReactNode[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-5 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={head.length}
                className="px-5 py-10 text-center text-muted-foreground"
              >
                Nothing here yet.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                {r.map((cell, j) => (
                  <td key={j} className="px-5 py-3 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
