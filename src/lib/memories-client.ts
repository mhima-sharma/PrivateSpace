import type { PhotoDTO } from "@/lib/serialize";

export type { PhotoDTO };

export interface CommentDTO {
  id: string;
  message: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
  canDelete: boolean;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export type PhotoScope = "all" | "mine" | "others";

export async function fetchPhotos(
  cursor?: string | null,
  scope: PhotoScope = "all",
  userId?: string,
) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  // A specific user's grid takes precedence over scope.
  if (userId) params.set("user", userId);
  else if (scope !== "all") params.set("scope", scope);
  return asJson<{ photos: PhotoDTO[]; nextCursor: string | null }>(
    await fetch(`/api/photos?${params.toString()}`, { cache: "no-store" }),
  );
}

export async function uploadPhoto(file: File, caption: string) {
  const fd = new FormData();
  fd.append("file", file);
  if (caption) fd.append("caption", caption);
  return asJson<{ photo: PhotoDTO }>(
    await fetch("/api/photos", { method: "POST", body: fd }),
  );
}

export async function toggleLike(photoId: string) {
  return asJson<{ liked: boolean; likeCount: number }>(
    await fetch(`/api/photos/${photoId}/like`, { method: "POST" }),
  );
}

export async function deletePhoto(photoId: string) {
  return asJson<{ ok: true }>(
    await fetch(`/api/photos/${photoId}`, { method: "DELETE" }),
  );
}

export async function fetchComments(photoId: string) {
  return asJson<{ comments: CommentDTO[] }>(
    await fetch(`/api/photos/${photoId}/comments`, { cache: "no-store" }),
  );
}

export async function addComment(photoId: string, message: string) {
  return asJson<{ comment: CommentDTO }>(
    await fetch(`/api/photos/${photoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }),
  );
}

export async function deleteComment(commentId: string) {
  return asJson<{ ok: true }>(
    await fetch(`/api/comments/${commentId}`, { method: "DELETE" }),
  );
}
