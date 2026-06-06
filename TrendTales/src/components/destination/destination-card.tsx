import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar } from "lucide-react";
import type { TravelDestination } from "@prisma/client";

export function DestinationCard({ destination }: { destination: TravelDestination }) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="group block overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-muted">
        {destination.coverImage ? (
          <Image
            src={destination.coverImage}
            alt={destination.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full gradient-brand" />
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-heading text-lg font-bold group-hover:text-primary">
          {destination.name}
        </h3>
        {destination.location && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {destination.location}
          </p>
        )}
        {destination.bestTimeToVisit && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {destination.bestTimeToVisit}
          </p>
        )}
      </div>
    </Link>
  );
}
