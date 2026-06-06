"use client";

import * as React from "react";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@prisma/client";
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
import { createCategory, updateCategory, deleteCategory } from "@/actions/category.actions";
import type { CategoryInput } from "@/lib/validations";

type CategoryRow = Category & { _count?: { blogs: number } };

const empty: CategoryInput = {
  name: "",
  slug: "",
  description: "",
  image: "",
  isActive: true,
  order: 0,
};

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<CategoryInput>(empty);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setSlugTouched(false);
    setOpen(true);
  }

  function openEdit(c: CategoryRow) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image: c.image ?? "",
      isActive: c.isActive,
      order: c.order,
    });
    setSlugTouched(true);
    setOpen(true);
  }

  function setName(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = editingId
        ? await updateCategory(editingId, form)
        : await createCategory(form);
      if (res.ok) {
        toast.success(editingId ? "Category updated" : "Category created");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.ok) toast.success("Category deleted");
      else toast.error(res.error);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} variant="brand">
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Blogs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                <TableCell>{c._count?.blogs ?? 0}</TableCell>
                <TableCell>
                  {c.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Hidden</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(c.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" required value={form.name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea id="cat-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Image</Label>
              <ImageUpload value={form.image ?? ""} onChange={(url) => setForm((f) => ({ ...f, image: url }))} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Label htmlFor="cat-order">Display order</Label>
                <Input
                  id="cat-order"
                  type="number"
                  className="w-24"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="cat-active">Active</Label>
                <Switch id="cat-active" checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
              </div>
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
