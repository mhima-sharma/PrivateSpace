"use client";

import * as React from "react";
import Image from "next/image";
import { Pencil, Trash2, Plus, Loader2, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PLATFORMS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { createProduct, updateProduct, deleteProduct } from "@/actions/product.actions";
import type { ProductInput } from "@/lib/validations";

type ProductRow = Omit<Product, "price"> & { price: number | null; blog?: { id: string; title: string; slug: string } | null };
type BlogOption = { id: string; title: string };

const PLATFORM_KEYS = Object.keys(PLATFORMS) as (keyof typeof PLATFORMS)[];

const empty: ProductInput = {
  name: "",
  description: "",
  image: "",
  price: undefined,
  currency: "INR",
  affiliateUrl: "",
  platform: "AMAZON",
  blogId: "",
  isFeatured: false,
};

export function ProductManager({
  products,
  blogs,
}: {
  products: ProductRow[];
  blogs: BlogOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<ProductInput>(empty);
  const [pending, startTransition] = React.useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(p: ProductRow) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      image: p.image ?? "",
      price: p.price != null ? Number(p.price) : undefined,
      currency: p.currency,
      affiliateUrl: p.affiliateUrl,
      platform: p.platform,
      blogId: p.blogId ?? "",
      isFeatured: p.isFeatured,
    });
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = editingId ? await updateProduct(editingId, form) : await createProduct(form);
      if (res.ok) {
        toast.success(editingId ? "Product updated" : "Product created");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res.ok) toast.success("Product deleted");
      else toast.error(res.error);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} variant="brand">
          <Plus className="h-4 w-4" /> New Product
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No products yet.
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {p.image && (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                        <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40px" />
                      </div>
                    )}
                    <span className="font-medium">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{PLATFORMS[p.platform].label}</Badge>
                </TableCell>
                <TableCell>{p.price != null ? formatPrice(Number(p.price), p.currency) : "—"}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MousePointerClick className="h-3.5 w-3.5" /> {p.clicks}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)} aria-label="Delete">
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
            <DialogTitle>{editingId ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Image</Label>
              <ImageUpload value={form.image ?? ""} onChange={(url) => setForm((f) => ({ ...f, image: url }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price</Label>
                <Input
                  id="p-price"
                  type="number"
                  step="0.01"
                  value={form.price ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === "" ? undefined : Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-currency">Currency</Label>
                <Input id="p-currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-url">Affiliate URL</Label>
              <Input id="p-url" type="url" required placeholder="https://…" value={form.affiliateUrl} onChange={(e) => setForm((f) => ({ ...f, affiliateUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v as ProductInput["platform"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORM_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{PLATFORMS[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Attach to blog (optional)</Label>
                <Select value={form.blogId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, blogId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {blogs.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="p-featured" checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
              <Label htmlFor="p-featured">Feature on homepage</Label>
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
