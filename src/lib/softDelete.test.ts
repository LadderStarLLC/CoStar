import { describe, expect, it } from 'vitest';
import { buildSoftDeleteMetadata, isSoftDeleted } from './softDelete';

describe('soft delete helpers', () => {
  it('builds consistent soft delete metadata', () => {
    expect(buildSoftDeleteMetadata({
      deletedAt: 'now',
      deletedBy: 'uid-1',
      deletionReason: 'user request',
      deleteSource: 'user',
    })).toEqual({
      deletedAt: 'now',
      deletedBy: 'uid-1',
      deletionReason: 'user request',
      deleteSource: 'user',
    });
  });

  it('detects deleted and removed records', () => {
    expect(isSoftDeleted({ deletedAt: 'now' })).toBe(true);
    expect(isSoftDeleted({ status: 'deleted' })).toBe(true);
    expect(isSoftDeleted({ status: 'removed' })).toBe(true);
    expect(isSoftDeleted({ status: 'active' })).toBe(false);
  });
});
