"use client";

import * as React from "react";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TravelDestination } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageUpload } from "@/components/shared/image-upload";
import { slugify } from "@/lib/utils";
import {
  createDestination,
  updateDestination,
  deleteDestination,
} from "@/actions/destination.actions";
import type { DestinationInput } from "@/lib/validations";

type DestRow = TravelDestination & { _count?: { blogs: number } };

const empty: DestinationInput = {
  name: "",
  slug: "",
  location: "",
  description: "",
  bestTimeToVisit: "",
  budget: "",
  travelTips: "",
  gallery: [],
  mapUrl: "",
  coverImage: "",
  isFeatured: false,
};

function asGallery(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function DestinationManager({ destinations }: { destinations: DestRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DestinationInput>(empty);
  const [galleryText, setGalleryText] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setGalleryText("");
    setSlugTouched(false);
    setOpen(true);
  }

  function openEdit(d: DestRow) {
    setEditingId(d.id);
    const gallery = asGallery(d.gallery);
    setForm({
      name: d.name,
      slug: d.slug,
      location: d.location ?? "",
      description: d.description ?? "",
      bestTimeToVisit: d.bestTimeToVisit ?? "",
      budget: d.budget ?? "",
      travelTips: d.travelTips ?? "",
      gallery,
      mapUrl: d.mapUrl ?? "",
      coverImage: d.coverImage ?? "",
      isFeatured: d.isFeatured,
    });
    setGalleryText(gallery.join("\n"));
    setSlugTouched(true);
    setOpen(true);
  }

  function setName(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const gallery = galleryText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = { ...form, gallery };
    startTransition(async () => {
      const res = editingId
        ? await updateDestination(editingId, payload)
        : await createDestination(payload);
      if (res.ok) {
        toast.success(editingId ? "Destination updated" : "Destination created");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this destination?")) return;
    startTransition(async () => {
      const res = await deleteDestination(id);
      if (res.ok) toast.success("Destination deleted");
      else toast.error(res.error);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} variant="brand">
          <Plus className="h-4 w-4" /> New Destination
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Blogs</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No destinations yet.
                </TableCell>
              </TableRow>
            )}
            {destinations.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-muted-foreground">{d.location ?? "—"}</TableCell>
                <TableCell>{d._count?.blogs ?? 0}</TableCell>
                <TableCell>{d.isFeatured ? <Badge variant="success">Yes</Badge> : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(d)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(d.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Destination" : "New Destination"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="d-name">Name</Label>
                <Input id="d-name" required value={form.name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-slug">Slug</Label>
                <Input id="d-slug" required value={form.slug} onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="d-location">Location</Label>
                <Input id="d-location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-budget">Budget</Label>
                <Input id="d-budget" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-best">Best time to visit</Label>
              <Input id="d-best" value={form.bestTimeToVisit} onChange={(e) => setForm((f) => ({ ...f, bestTimeToVisit: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-desc">Description</Label>
              <Textarea id="d-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-tips">Travel tips</Label>
              <Textarea id="d-tips" value={form.travelTips} onChange={(e) => setForm((f) => ({ ...f, travelTips: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Cover image</Label>
              <ImageUpload value={form.coverImage ?? ""} onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-gallery">Gallery image URLs (one per line)</Label>
              <Textarea id="d-gallery" rows={3} value={galleryText} onChange={(e) => setGalleryText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-map">Map embed URL</Label>
              <Input id="d-map" placeholder="https://www.google.com/maps?q=…&output=embed" value={form.mapUrl} onChange={(e) => setForm((f) => ({ ...f, mapUrl: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="d-featured" checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
              <Label htmlFor="d-featured">Feature on homepage</Label>
            </div>
            <DialogFooter>
              <Button type="submit" variant="brand" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
