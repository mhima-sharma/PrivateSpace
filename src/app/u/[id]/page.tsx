import { ProfileView } from "@/components/profile/profile-view";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="pb-24">
      <section className="container py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <ProfileView id={id} />
        </div>
      </section>
    </div>
  );
}
