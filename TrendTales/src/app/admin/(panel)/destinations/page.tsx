import { PageHeader } from "@/components/admin/page-header";
import { DestinationManager } from "@/components/admin/destination-manager";
import { getAllDestinations } from "@/services/destination.service";

export const dynamic = "force-dynamic";

export default async function AdminDestinationsPage() {
  const destinations = await getAllDestinations();
  return (
    <div>
      <PageHeader title="Travel Destinations" description="Manage destinations featured across travel blogs." />
      <DestinationManager destinations={destinations} />
    </div>
  );
}
