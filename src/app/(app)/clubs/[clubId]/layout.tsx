import { ClubWorkspaceLayout } from '@/components/club/club-workspace-layout';

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  return <ClubWorkspaceLayout clubId={clubId}>{children}</ClubWorkspaceLayout>;
}
