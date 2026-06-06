import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { DestinationBlock } from "@/components/destination/destination-block";
import { getDestinationBySlug } from "@/services/destination.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return buildMetadata({ title: "Destination", noIndex: true });
  return buildMetadata({
    title: destination.name,
    description: destination.description ?? `Travel guide for ${destination.name}.`,
    path: `/destinations/${slug}`,
    image: destination.coverImage,
  });
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  return (
    <div className="py-10">
      {destination.coverImage && (
        <div className="relative mb-8 h-[40vh] min-h-[300px] w-full overflow-hidden">
          <Image src={destination.coverImage} alt={destination.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="container relative flex h-full items-end pb-8">
            <h1 className="font-heading text-4xl font-extrabold text-white">{destination.name}</h1>
          </div>
        </div>
      )}

      <div className="container max-w-3xl space-y-6">
        {!destination.coverImage && (
          <h1 className="font-heading text-4xl font-extrabold">{destination.name}</h1>
        )}
        {destination.description && (
          <p className="text-lg text-muted-foreground">{destination.description}</p>
        )}

        <DestinationBlock destination={destination} />

        {destination.blogs.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold">Related Stories</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {destination.blogs.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/blog/${b.slug}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    {b.featuredImage && (
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded">
                        <Image src={b.featuredImage} alt={b.title} fill className="object-cover" sizes="80px" />
                      </div>
                    )}
                    <span className="font-medium">{b.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
