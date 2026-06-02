import { signImagePath } from "@/lib/signed-url";

export interface PhotoDTO {
  id: string;
  imageUrl: string; // signed, short-lived
  caption: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  isHidden: boolean;
  createdAt: string;
  uploader: { id: string; name: string | null; email: string };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  canDelete: boolean;
}

type PhotoWithRelations = {
  id: string;
  caption: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  isHidden: boolean;
  createdAt: Date;
  uploadedBy: string;
  uploader: { id: string; name: string | null; email: string };
  _count: { likes: number; comments: number };
  likes: { userId: string }[];
};

export interface ProfileDTO {
  id: string;
  name: string | null;
  username: string; // derived from the email local-part
  email: string | null; // only exposed to the profile owner
  bio: string | null;
  postCount: number;
  isSelf: boolean;
}

export function serializeProfile(
  user: { id: string; name: string | null; email: string; bio: string | null },
  viewer: { id: string },
  postCount: number,
): ProfileDTO {
  const isSelf = user.id === viewer.id;
  return {
    id: user.id,
    name: user.name,
    username: user.email.split("@")[0] ?? user.email,
    email: isSelf ? user.email : null,
    bio: user.bio,
    postCount,
    isSelf,
  };
}

export function serializePhoto(
  photo: PhotoWithRelations,
  viewer: { id: string; role: "USER" | "ADMIN" },
): PhotoDTO {
  return {
    id: photo.id,
    imageUrl: signImagePath(photo.id),
    caption: photo.caption,
    mimeType: photo.mimeType,
    width: photo.width,
    height: photo.height,
    isHidden: photo.isHidden,
    createdAt: photo.createdAt.toISOString(),
    uploader: photo.uploader,
    likeCount: photo._count.likes,
    commentCount: photo._count.comments,
    likedByMe: photo.likes.some((l) => l.userId === viewer.id),
    canDelete: viewer.role === "ADMIN" || photo.uploadedBy === viewer.id,
  };
}
