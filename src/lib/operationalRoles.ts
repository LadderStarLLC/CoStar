export type OperationalRoleId = 'blog.writer' | 'blog.publisher';

export interface OperationalRoleDefinition {
  id: OperationalRoleId;
  label: string;
  description: string;
  field: 'blogRole';
  value: string;
}

export const operationalRoles: OperationalRoleDefinition[] = [
  {
    id: 'blog.writer',
    label: 'Blog writer',
    description: 'Can create AI or human blog drafts and edit unpublished blog drafts.',
    field: 'blogRole',
    value: 'writer',
  },
  {
    id: 'blog.publisher',
    label: 'Blog publisher',
    description: 'Can create, edit, publish, and unpublish blog posts.',
    field: 'blogRole',
    value: 'publisher',
  },
];

export function getOperationalRolesForProfile(profile?: Record<string, unknown> | null): OperationalRoleId[] {
  return operationalRoles
    .filter((role) => profile?.[role.field] === role.value)
    .map((role) => role.id);
}

export function getOperationalRoleDefinition(roleId: unknown): OperationalRoleDefinition | null {
  return operationalRoles.find((role) => role.id === roleId) ?? null;
}

export function canModifyOperationalRolesForProfile(profile?: Record<string, unknown> | null): boolean {
  return profile?.accountType !== 'owner';
}

export function buildOperationalRoleUpdate(
  profile: Record<string, unknown>,
  roleId: unknown,
  enabled: unknown,
): { updates: Record<string, unknown>; changed: boolean } {
  const role = getOperationalRoleDefinition(roleId);
  if (!role || typeof enabled !== 'boolean') {
    throw new Response(JSON.stringify({ error: 'Valid roleId and enabled are required.' }), { status: 400 });
  }

  const currentValue = profile[role.field];
  if (enabled) {
    return {
      updates: { [role.field]: role.value },
      changed: currentValue !== role.value,
    };
  }

  if (currentValue !== role.value) {
    return { updates: {}, changed: false };
  }

  return {
    updates: { [role.field]: null },
    changed: true,
  };
}
