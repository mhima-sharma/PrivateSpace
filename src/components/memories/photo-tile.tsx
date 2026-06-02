"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import type { PhotoDTO } from "@/lib/memories-client";
import { Modal } from "@/components/ui/modal";
import { PhotoCard } from "@/components/memories/photo-card";

/**
 * Instagram-style profile-grid thumbnail. Square crop, like/comment counts on
 * hover, and opens the full post in a modal on click.
 */
export function PhotoTile({ photo }: { photo: PhotoDTO }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative aspect-square w-full overflow-hidden rounded-md bg-muted"
      >
        <Image
          src={photo.imageUrl}
          alt={photo.caption ?? "Photo"}
          fill
          unoptimized
          sizes="(max-width: 640px) 33vw, 280px"
          className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 hidden place-items-center gap-5 bg-black/40 text-sm font-semibold text-white group-hover:grid sm:flex sm:items-center sm:justify-center">
          <span className="flex items-center gap-1.5">
            <Heart className="size-5 fill-white" /> {photo.likeCount}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="size-5 fill-white" /> {photo.commentCount}
          </span>
        </div>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} className="max-w-md">
        <PhotoCard photo={photo} />
      </Modal>
    </>
  );
}
