import type { RoleName } from '@/types';

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  admin: [
    'club:manage',
    'members:manage',
    'members:view',
    'chat:manage',
    'chat:send',
    'polls:manage',
    'polls:vote',
    'events:manage',
    'events:view',
    'content:moderate',
  ],
  moderator: [
    'members:view',
    'chat:manage',
    'chat:send',
    'polls:manage',
    'polls:vote',
    'events:manage',
    'events:view',
    'content:moderate',
  ],
  member: ['members:view', 'chat:send', 'polls:vote', 'events:view'],
};

export function hasPermission(role: RoleName, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageMembers(role: RoleName): boolean {
  return hasPermission(role, 'members:manage');
}

export function canManageClub(role: RoleName): boolean {
  return hasPermission(role, 'club:manage');
}

export function roleLabel(role: RoleName): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
