import { describe, expect, it } from 'vitest';
import {
  buildOperationalRoleUpdate,
  canModifyOperationalRolesForProfile,
  getOperationalRoleDefinition,
  getOperationalRolesForProfile,
  operationalRoles,
} from './operationalRoles';

describe('operational role registry', () => {
  it('lists blog writer and publisher roles', () => {
    expect(operationalRoles.map((role) => role.id)).toEqual(['blog.writer', 'blog.publisher']);
    expect(getOperationalRoleDefinition('blog.writer')).toMatchObject({ field: 'blogRole', value: 'writer' });
    expect(getOperationalRoleDefinition('blog.publisher')).toMatchObject({ field: 'blogRole', value: 'publisher' });
  });

  it('derives active roles from profile fields', () => {
    expect(getOperationalRolesForProfile({ blogRole: 'writer' })).toEqual(['blog.writer']);
    expect(getOperationalRolesForProfile({ blogRole: 'publisher' })).toEqual(['blog.publisher']);
    expect(getOperationalRolesForProfile({ blogRole: 'unknown' })).toEqual([]);
  });

  it('keeps blog roles mutually exclusive through one field', () => {
    expect(buildOperationalRoleUpdate({ blogRole: 'writer' }, 'blog.publisher', true)).toEqual({
      updates: { blogRole: 'publisher' },
      changed: true,
    });
    expect(buildOperationalRoleUpdate({ blogRole: 'publisher' }, 'blog.writer', true)).toEqual({
      updates: { blogRole: 'writer' },
      changed: true,
    });
  });

  it('clears only the currently active role when disabling', () => {
    expect(buildOperationalRoleUpdate({ blogRole: 'publisher' }, 'blog.publisher', false)).toEqual({
      updates: { blogRole: null },
      changed: true,
    });
    expect(buildOperationalRoleUpdate({ blogRole: 'publisher' }, 'blog.writer', false)).toEqual({
      updates: {},
      changed: false,
    });
  });

  it('blocks operational role changes for owner accounts', () => {
    expect(canModifyOperationalRolesForProfile({ accountType: 'owner' })).toBe(false);
    expect(canModifyOperationalRolesForProfile({ accountType: 'admin' })).toBe(true);
    expect(canModifyOperationalRolesForProfile({ accountType: 'business' })).toBe(true);
  });
});
