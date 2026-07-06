'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { updateMemberRole } from '@/lib/api/clubs';
import { getApiErrorMessage } from '@/lib/api/client';
import { canManageMembers, roleLabel } from '@/lib/permissions';
import type { ClubMember, RoleName } from '@/types';

interface MembersListProps {
  clubId: string;
  members: ClubMember[];
  currentUserId: string;
  currentUserRole: RoleName | null;
  ownerId: string;
}

export function MembersList({
  clubId,
  members,
  currentUserId,
  currentUserRole,
  ownerId,
}: MembersListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = currentUserRole ? canManageMembers(currentUserRole) : false;

  const handleRoleChange = async (userId: string, role: RoleName) => {
    setLoadingId(userId);
    setError(null);
    try {
      await updateMemberRole(clubId, userId, role);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update role'));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {members.map((member) => {
        const isOwner = member.user_id === ownerId;
        const isSelf = member.user_id === currentUserId;
        return (
          <div
            key={member.id}
            className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {member.display_name}
                {isSelf ? <span className="text-muted-foreground"> (you)</span> : null}
              </p>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {canManage && !isOwner && member.status === 'active' ? (
                <select
                  className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
                  value={member.role_name}
                  disabled={loadingId === member.user_id}
                  onChange={(e) => handleRoleChange(member.user_id, e.target.value as RoleName)}
                >
                  {(['admin', 'moderator', 'member'] as RoleName[]).map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge variant={member.role_name === 'admin' ? 'success' : 'muted'}>
                  {roleLabel(member.role_name)}
                  {isOwner ? ' · Owner' : ''}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
