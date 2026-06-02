import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { serializePhoto } from "@/lib/serialize";
import { visibleAuthorIds } from "@/lib/invites";
import { idParamSchema } from "@/lib/validation";
import { PhotoCard } from "@/components/memories/photo-card";

const photoInclude = {
  uploader: { select: { id: true, name: true, email: true } },
  _count: { select: { likes: true, comments: true } },
} as const;

/**
 * Single-post page behind a shareable link (/photos/<id>).
 *
 * The route is "public" only in the sense that the middleware lets the request
 * through — the auth gate lives HERE so we can bounce signed-out visitors to
 * /login with a callbackUrl pointing back at this post. After they sign in they
 * land straight back on the shared photo. Signed-in users see the post inline,
 * subject to the same visibility rules as the feed (hidden + invite-graph).
 */
export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/photos/${id}`)}`);
  }

  // Reject malformed ids before touching the database.
  if (!idParamSchema.safeParse({ id }).success) notFound();

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: {
      ...photoInclude,
      likes: { where: { userId: user.id }, select: { userId: true } },
    },
  });
  if (!photo) notFound();

  // Non-admins never see hidden (moderated) posts.
  if (photo.isHidden && user.role !== "ADMIN") notFound();

  // A shared link must not bypass the invite-graph visibility scope.
  const allowed = await visibleAuthorIds(user);
  if (allowed !== null && !allowed.includes(photo.uploadedBy)) notFound();

  const dto = serializePhoto(photo, user);

  return (
    <div className="pb-24">
      <section className="container py-6 sm:py-10">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to gallery
          </Link>
          <PhotoCard photo={dto} />
        </div>
      </section>
    </div>
  );
}
