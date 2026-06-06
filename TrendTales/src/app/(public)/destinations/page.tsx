import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { DestinationCard } from "@/components/destination/destination-card";
import { getAllDestinations } from "@/services/destination.service";

export const metadata: Metadata = buildMetadata({
  title: "Travel Destinations",
  description: "Explore popular travel destinations, guides, and tips on TrendTales.",
  path: "/destinations",
});

export default async function DestinationsPage() {
  const destinations = await getAllDestinations();
  return (
    <div className="container space-y-8 py-12">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-extrabold md:text-4xl">Travel Destinations</h1>
        <p className="text-muted-foreground">Plan your next adventure with our destination guides.</p>
      </header>
      {destinations.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          No destinations yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      )}
    </div>
  );
}
