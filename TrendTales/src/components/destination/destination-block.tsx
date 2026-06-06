import Image from "next/image";
import { MapPin, Calendar, Wallet, Lightbulb } from "lucide-react";
import type { TravelDestination } from "@prisma/client";

function asGallery(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function DestinationBlock({ destination }: { destination: TravelDestination }) {
  const gallery = asGallery(destination.gallery);

  return (
    <aside className="my-8 space-y-6 rounded-2xl border bg-muted/30 p-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-bold">Destination: {destination.name}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {destination.location && (
          <Fact icon={<MapPin className="h-4 w-4" />} label="Location" value={destination.location} />
        )}
        {destination.bestTimeToVisit && (
          <Fact icon={<Calendar className="h-4 w-4" />} label="Best time to visit" value={destination.bestTimeToVisit} />
        )}
        {destination.budget && (
          <Fact icon={<Wallet className="h-4 w-4" />} label="Budget" value={destination.budget} />
        )}
      </div>

      {destination.travelTips && (
        <div className="rounded-lg bg-background p-4">
          <p className="mb-1 flex items-center gap-1 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" /> Travel tips
          </p>
          <p className="text-sm text-muted-foreground">{destination.travelTips}</p>
        </div>
      )}

      {gallery.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {gallery.slice(0, 6).map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
              <Image src={src} alt={`${destination.name} ${i + 1}`} fill className="object-cover" sizes="200px" />
            </div>
          ))}
        </div>
      )}

      {destination.mapUrl && (
        <div className="overflow-hidden rounded-lg border">
          <iframe
            src={destination.mapUrl}
            title={`Map of ${destination.name}`}
            className="h-64 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </aside>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background p-3">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
