import { GalleryCard } from '@/components/club/gallery-card';
import { CreateGalleryForm } from '@/components/forms/create-gallery-form';
import { EmptyState } from '@/components/common/empty-state';
import { fetchClubServer } from '@/lib/api/clubs.server';
import { fetchGalleriesServer } from '@/lib/api/club-resources.server';
import { Image } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Gallery' };

export default async function ClubGalleryPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const { membership } = await fetchClubServer(clubId);
  if (!membership) redirect(`/clubs/${clubId}`);

  let galleries: Awaited<ReturnType<typeof fetchGalleriesServer>> = [];
  try {
    galleries = await fetchGalleriesServer(clubId);
  } catch {
    galleries = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gallery</h1>
        <p className="text-muted-foreground">Club photo albums</p>
      </div>
      <CreateGalleryForm clubId={clubId} />
      {galleries.length === 0 ? (
        <EmptyState icon={Image} title="No galleries" description="Create your first album." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((g) => (
            <GalleryCard key={g.id} clubId={clubId} gallery={g} />
          ))}
        </div>
      )}
    </div>
  );
}
