"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { slugify } from "@/lib/utils";
import { TRAVEL_CATEGORY_SLUG } from "@/lib/constants";
import { createBlog, updateBlog } from "@/actions/blog.actions";
import type { BlogInput } from "@/lib/validations";

interface BlogFormProps {
  categories: { id: string; name: string; slug: string }[];
  destinations: { id: string; name: string }[];
  blogId?: string;
  initial?: Partial<BlogInput>;
}

const emptyForm: BlogInput = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  categoryId: "",
  destinationId: "",
  tags: [],
  status: "DRAFT",
  isFeatured: false,
  isTrending: false,
  scheduledFor: "",
  metaTitle: "",
  metaDescription: "",
};

export function BlogForm({ categories, destinations, blogId, initial }: BlogFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<BlogInput>({ ...emptyForm, ...initial });
  const [tagInput, setTagInput] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial?.slug));
  const [pending, startTransition] = React.useTransition();

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const isTravel = selectedCategory?.slug === TRAVEL_CATEGORY_SLUG;

  function set<K extends keyof BlogInput>(key: K, value: BlogInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setTitle(title: string) {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  }

  function submit(status: BlogInput["status"]) {
    const payload = { ...form, status };
    if (!payload.title || !payload.slug) {
      toast.error("Title and slug are required");
      return;
    }
    if (!payload.categoryId) {
      toast.error("Please choose a category");
      return;
    }
    if (!payload.content || payload.content === "<p></p>") {
      toast.error("Content cannot be empty");
      return;
    }
    startTransition(async () => {
      const res = blogId ? await updateBlog(blogId, payload) : await createBlog(payload);
      if (res.ok) {
        toast.success(blogId ? "Blog saved" : "Blog created");
        router.push("/admin/blogs");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(form.status);
      }}
      className="grid gap-6 lg:grid-cols-3"
    >
      {/* Main column */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1.5">
              <Label htmlFor="b-title">Title</Label>
              <Input id="b-title" value={form.title} onChange={(e) => setTitle(e.target.value)} placeholder="An amazing headline" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-slug">Slug</Label>
              <Input id="b-slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-excerpt">Excerpt</Label>
              <Textarea id="b-excerpt" value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="A short summary shown in cards and search results" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor value={form.content} onChange={(html) => set("content", html)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="b-metatitle">Meta title</Label>
              <Input id="b-metatitle" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder="Defaults to the blog title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-metadesc">Meta description</Label>
              <Textarea id="b-metadesc" value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} placeholder="Defaults to the excerpt" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as BlogInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.status === "SCHEDULED" && (
              <div className="space-y-1.5">
                <Label htmlFor="b-schedule">Publish at</Label>
                <Input id="b-schedule" type="datetime-local" value={form.scheduledFor} onChange={(e) => set("scheduledFor", e.target.value)} />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="b-featured">Featured</Label>
              <Switch id="b-featured" checked={form.isFeatured} onCheckedChange={(v) => set("isFeatured", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="b-trending">Trending</Label>
              <Switch id="b-trending" checked={form.isTrending} onCheckedChange={(v) => set("isTrending", v)} />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button type="button" variant="brand" disabled={pending} onClick={() => submit("PUBLISHED")}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} Publish
              </Button>
              <Button type="button" variant="outline" disabled={pending} onClick={() => submit("DRAFT")}>
                Save as draft
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organize</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isTravel && (
              <div className="space-y-1.5">
                <Label>Travel destination</Label>
                <Select value={form.destinationId || "none"} onValueChange={(v) => set("destinationId", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {destinations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}
                      <button type="button" onClick={() => set("tags", form.tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Featured image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload value={form.featuredImage ?? ""} onChange={(url) => set("featuredImage", url)} />
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
