"use client";

import * as React from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Uploads an image to Cloudinary via the /api/upload route handler.
 * Falls back to a manual URL field so the form is usable even without
 * Cloudinary configured.
 */
export function ImageUpload({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          <Image src={value} alt="Preview" fill className="object-cover" sizes="400px" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted/50"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
          <span className="text-sm">{uploading ? "Uploading…" : "Click to upload image"}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      <Input
        placeholder="…or paste an image URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
