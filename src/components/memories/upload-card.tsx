"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadPhoto } from "@/lib/memories-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function UploadCard({
  bare = false,
  onUploaded,
}: {
  /** Render without the outer Card chrome (e.g. inside a modal). */
  bare?: boolean;
  /** Called after a successful upload (e.g. to close a modal). */
  onUploaded?: () => void;
}) {
  const qc = useQueryClient();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => uploadPhoto(file!, caption),
    onSuccess: () => {
      // Prefix match invalidates every scope (feed + my posts).
      qc.invalidateQueries({ queryKey: ["photos"] });
      reset();
      onUploaded?.();
    },
    onError: (e: Error) => setError(e.message),
  });

  function reset() {
    setFile(null);
    setCaption("");
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

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

  const body = (
    <>
      {!preview ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/40">
          <ImagePlus className="size-7 text-primary" />
          <span className="text-sm font-medium">Add a photo</span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG, WebP, GIF or AVIF · up to 8&nbsp;MB
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onPick}
          />
        </label>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-xl">
            {/* object URL preview of a local file */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="max-h-72 w-full object-cover"
            />
            <button
              onClick={reset}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur"
              aria-label="Remove"
            >
              <X className="size-4" />
            </button>
          </div>
          <Input
            placeholder="Add a caption (optional)"
            value={caption}
            maxLength={500}
            onChange={(e) => setCaption(e.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              Share photo
            </Button>
          </div>
        </div>
      )}
      {!preview && error && (
        <p className="mt-3 text-xs text-destructive">{error}</p>
      )}
    </>
  );

  if (bare) return body;

  return (
    <Card>
      <CardContent className="p-5">{body}</CardContent>
    </Card>
  );
}
