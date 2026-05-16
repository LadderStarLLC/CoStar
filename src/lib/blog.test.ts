import { describe, expect, it } from 'vitest';
import { getBlogPermissions, normalizeBlogRole, safeParseBlogContent } from './blog';

describe('blog permissions', () => {
  it('does not grant anonymous or normal accounts blog access', () => {
    expect(getBlogPermissions(null)).toEqual({
      canReadDrafts: false,
      canWriteDrafts: false,
      canPublish: false,
    });
    expect(getBlogPermissions({ accountType: 'business' })).toEqual({
      canReadDrafts: false,
      canWriteDrafts: false,
      canPublish: false,
    });
  });

  it('allows writers to read and edit drafts without publishing', () => {
    expect(normalizeBlogRole('writer')).toBe('writer');
    expect(getBlogPermissions({ accountType: 'talent', blogRole: 'writer' })).toEqual({
      canReadDrafts: true,
      canWriteDrafts: true,
      canPublish: false,
    });
  });

  it('allows publishers and privileged accounts to publish', () => {
    expect(normalizeBlogRole('publisher')).toBe('publisher');
    expect(getBlogPermissions({ accountType: 'business', blogRole: 'publisher' }).canPublish).toBe(true);
    expect(getBlogPermissions({ accountType: 'admin' }).canPublish).toBe(true);
    expect(getBlogPermissions({ accountType: 'owner' }).canPublish).toBe(true);
  });

  it('rejects malformed TipTap content safely', () => {
    expect(safeParseBlogContent('{bad')).toEqual({ type: 'doc', content: [{ type: 'paragraph', content: [] }] });
  });
});
