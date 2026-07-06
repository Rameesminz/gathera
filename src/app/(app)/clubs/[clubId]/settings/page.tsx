import { ClubMembershipActions } from '@/components/common/club-membership-actions';
import { InvitePanel } from '@/components/club/invite-panel';
import { JoinRequestsPanel } from '@/components/club/join-requests-panel';
import { ClubSettingsForm } from '@/components/forms/club-settings-form';
import { ClubJoinPolicyForm } from '@/components/forms/club-join-policy-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchClubServer } from '@/lib/api/clubs.server';
import { canManageClub, roleLabel } from '@/lib/permissions';
import { redirect } from 'next/navigation';

function parseSettings(raw: string) {
  try {
    return JSON.parse(raw) as { joinPolicy?: string; visibility?: string };
  } catch {
    return {};
  }
}

export const metadata = { title: 'Club Settings' };

export default async function ClubSettingsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const { club, membership } = await fetchClubServer(clubId);

  if (!membership) redirect(`/clubs/${clubId}`);

  const isOwner = club.owner_id === membership.user_id;
  const canEdit = canManageClub(membership.role_name);
  const settings = parseSettings(club.settings);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Club Settings</h1>
        <p className="text-muted-foreground">Manage your membership and club info</p>
      </div>

      {canEdit ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Join policy</CardTitle>
            </CardHeader>
            <CardContent>
              <ClubJoinPolicyForm clubId={clubId} initial={settings} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Invites</CardTitle>
            </CardHeader>
            <CardContent>
              <InvitePanel clubId={clubId} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Join requests</CardTitle>
            </CardHeader>
            <CardContent>
              <JoinRequestsPanel clubId={clubId} />
            </CardContent>
          </Card>
        </>
      ) : null}

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit club</CardTitle>
          </CardHeader>
          <CardContent>
            <ClubSettingsForm club={club} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Club info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{club.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span>{club.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{club.status}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your role</span>
            <Badge variant="success">{roleLabel(membership.role_name)}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent>
          <ClubMembershipActions
            clubId={clubId}
            membership={membership}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>
    </div>
  );
}
