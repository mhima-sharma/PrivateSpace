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
  ImagePlus,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDateTime } from "@/lib/utils";
import {
  fetchAllEvents,
  createEvent,
  deleteEvent,
  type EventDTO,
} from "@/lib/events-client";

type Tab = "events" | "invites" | "users" | "activity";

async function j<T>(req: Response | Promise<Response>): Promise<T> {
  const res = await req;
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
  return res.json();
}

export function AdminConsole() {
  const [tab, setTab] = React.useState<Tab>("events");
  const tabs: { id: Tab; label: string }[] = [
    { id: "events", label: "Events" },
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

      {tab === "events" && <EventsPanel />}
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
  published: boolean;
}

/**
 * Editable "event details" (occasion, note, celebrant, date) that get
 * published to the shared Updates page. Rendered on /updates for the publisher
 * only — no longer a tab in the admin console.
 */
export function EventPanel() {
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

  // Publish / unpublish (hide) — toggles visibility for everyone without
  // touching the saved text.
  const setPublished = useMutation({
    mutationFn: (published: boolean) =>
      j<{ settings: EventSettings }>(
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published }),
        }),
      ),
    onSuccess: (res) => {
      setError(null);
      setForm((f) => (f ? { ...f, published: res.settings.published } : f));
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
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-base font-semibold">Event details</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              form.published
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {form.published ? "Live" : "Hidden"}
          </span>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Edit the occasion and note shown on the Updates page. Changes are live
          immediately. Hide it to remove it from everyone&apos;s view.
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

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Check />}
            Save changes
          </Button>
          <Button
            variant="outline"
            onClick={() => setPublished.mutate(!form.published)}
            disabled={setPublished.isPending}
          >
            {setPublished.isPending ? (
              <Loader2 className="animate-spin" />
            ) : form.published ? (
              <EyeOff />
            ) : (
              <Eye />
            )}
            {form.published ? "Hide from everyone" : "Publish"}
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

// ── Events (story-style, 24h, then archived) ───────────────────────────────
function EventsPanel() {
  const qc = useQueryClient();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "events"],
    queryFn: fetchAllEvents,
  });

  function reset() {
    setTitle("");
    setBody("");
    setError(null);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  const create = useMutation({
    mutationFn: () => createEvent({ title, body, file }),
    onSuccess: () => {
      reset();
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const events = data?.events ?? [];
  const active = events.filter((e) => e.isActive);
  const archived = events.filter((e) => !e.isActive);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-1 text-base font-semibold">Post an event</h3>
          <p className="mb-5 text-sm text-muted-foreground">
            Shows on everyone&apos;s dashboard for 24 hours, then moves to the
            archive below.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={title}
                maxLength={120}
                placeholder="e.g. Cake cutting at 8pm 🎂"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-body">Note (optional)</Label>
              <textarea
                id="event-body"
                value={body}
                maxLength={600}
                rows={3}
                placeholder="A few words about this moment…"
                onChange={(e) => setBody(e.target.value)}
                className="flex w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {preview ? (
              <div className="relative w-fit overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 object-cover"
                />
                <button
                  onClick={() => {
                    setFile(null);
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview(null);
                  }}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur"
                  aria-label="Remove image"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                <ImagePlus className="size-4 text-primary" />
                Add an image (optional)
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onPick}
                />
              </label>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div>
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending || !title.trim()}
              >
                {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                Post event
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Spinner />
          ) : (
            <div className="flex flex-col">
              <EventGroup
                heading={`Active${active.length ? ` (${active.length})` : ""}`}
                events={active}
                onDelete={(id) => remove.mutate(id)}
                emptyText="No active events right now."
              />
              <EventGroup
                heading={`Archive${archived.length ? ` (${archived.length})` : ""}`}
                events={archived}
                onDelete={(id) => remove.mutate(id)}
                emptyText="Nothing archived yet."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EventGroup({
  heading,
  events,
  onDelete,
  emptyText,
}: {
  heading: string;
  events: EventDTO[];
  onDelete: (id: string) => void;
  emptyText: string;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <p className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {heading}
      </p>
      {events.length === 0 ? (
        <p className="px-5 pb-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex items-start gap-3 border-t border-border/60 px-5 py-4"
            >
              {e.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.imageUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{e.title}</p>
                {e.body && (
                  <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">
                    {e.body}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Posted {formatDateTime(e.createdAt)}
                  {e.isActive ? (
                    <span className="ml-2 text-primary">· Active</span>
                  ) : (
                    <span className="ml-2">· Expired</span>
                  )}
                </p>
              </div>
              {e.canDelete && (
                <button
                  onClick={() => onDelete(e.id)}
                  className="mt-0.5 text-muted-foreground hover:text-destructive"
                  aria-label="Delete event"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
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
  canManageRole: boolean; // true only for the admin who invited this user
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
              {u.canManageRole && (
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
              )}
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
  if (rows.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        Nothing here yet.
      </p>
    );
  }

  return (
    <>
      {/* Desktop: regular table. */}
      <table className="hidden w-full text-left text-sm md:table">
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
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {r.map((cell, j) => (
                <td key={j} className="px-5 py-3 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: each row as a stacked card (label: value), no horizontal scroll. */}
      <div className="flex flex-col divide-y divide-border/60 md:hidden">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-col gap-2 px-5 py-4">
            {r.map((cell, j) => {
              const label = head[j];
              const hasLabel =
                typeof label === "string" ? label.trim() !== "" : !!label;
              return (
                <div
                  key={j}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  {hasLabel && (
                    <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                      {label}
                    </span>
                  )}
                  <span className={cn("text-right", !hasLabel && "ml-auto")}>
                    {cell}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
