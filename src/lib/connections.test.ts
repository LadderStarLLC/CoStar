import { describe, expect, it } from 'vitest';
import { isActiveConnection, type ConnectionRecord } from './connections';

const baseConnection: ConnectionRecord = {
  id: 'connection-1',
  requesterId: 'uid-1',
  targetId: 'uid-2',
  requesterRole: 'talent',
  targetRole: 'business',
  status: 'accepted',
  createdAt: 'then',
  updatedAt: 'now',
};

describe('connection soft delete behavior', () => {
  it('treats active connections as visible', () => {
    expect(isActiveConnection(baseConnection)).toBe(true);
  });

  it('hides removed and soft-deleted connections', () => {
    expect(isActiveConnection({ ...baseConnection, status: 'removed' })).toBe(false);
    expect(isActiveConnection({ ...baseConnection, deletedAt: 'now' })).toBe(false);
  });
});
