import { FileListItem } from '@/components/club/file-list-item';
import { FileUploadForm } from '@/components/forms/file-upload-form';
import { EmptyState } from '@/components/common/empty-state';
import { fetchClubServer } from '@/lib/api/clubs.server';
import { fetchFilesServer } from '@/lib/api/club-resources.server';
import { FolderOpen } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Files' };

export default async function ClubFilesPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const { membership } = await fetchClubServer(clubId);
  if (!membership) redirect(`/clubs/${clubId}`);

  let files: Awaited<ReturnType<typeof fetchFilesServer>> = [];
  try {
    files = await fetchFilesServer(clubId);
  } catch {
    files = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Files</h1>
        <p className="text-muted-foreground">Shared club documents</p>
      </div>
      <FileUploadForm clubId={clubId} />
      {files.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No files" description="Upload your first file." />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {files.map((file) => (
            <FileListItem key={file.id} clubId={clubId} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
