import { describe, expect, it } from 'vitest';
import {
  buildRecreatedAccountProfileUpdate,
  canStartDeletedAccountReactivation,
  isPendingReactivationFresh,
  isSelfDeletedAccount,
  normalizePublicReactivationType,
  resolveBootstrapAccountType,
  resolveSelfDeletedReactivationType,
} from './accountReactivation';

describe('account reactivation helpers', () => {
  const deletedProfile = {
    accountType: 'talent',
    deletedAt: 'now',
    deleteSource: 'user',
    disabled: true,
  };

  it('allows self-deleted non-privileged accounts with a public requested type', () => {
    expect(isSelfDeletedAccount(deletedProfile)).toBe(true);
    expect(canStartDeletedAccountReactivation(deletedProfile, 'business')).toBe(true);
    expect(normalizePublicReactivationType('user')).toBe('talent');
  });

  it('rejects privileged accounts', () => {
    expect(isSelfDeletedAccount({ ...deletedProfile, accountType: 'admin' })).toBe(false);
    expect(isSelfDeletedAccount({ ...deletedProfile, accountType: 'owner' })).toBe(false);
  });

  it('rejects accounts without self-delete metadata', () => {
    expect(isSelfDeletedAccount({ accountType: 'talent', disabled: true, moderationStatus: 'suspended' } as any)).toBe(false);
    expect(isSelfDeletedAccount({ ...deletedProfile, deleteSource: 'admin' })).toBe(false);
    expect(isSelfDeletedAccount({ ...deletedProfile, disabled: false })).toBe(false);
  });

  it('rejects invalid and privileged requested types', () => {
    expect(canStartDeletedAccountReactivation(deletedProfile, 'owner')).toBe(false);
    expect(canStartDeletedAccountReactivation(deletedProfile, 'admin')).toBe(false);
    expect(canStartDeletedAccountReactivation(deletedProfile, 'unknown')).toBe(false);
  });

  it('uses only fresh self-service pending reactivation requests', () => {
    expect(isPendingReactivationFresh({
      requestedType: 'agency',
      requestedAtMs: 1_000,
      source: 'self-service',
    }, 2_000)).toBe(true);
    expect(isPendingReactivationFresh({
      requestedType: 'agency',
      requestedAtMs: 1_000,
      source: 'self-service',
    }, 31 * 60 * 1000)).toBe(false);
  });

  it('resolves the recreated account type from pending request before body request', () => {
    expect(resolveSelfDeletedReactivationType({
      ...deletedProfile,
      pendingReactivation: {
        requestedType: 'agency',
        requestedAtMs: 1_000,
        source: 'self-service',
      },
    }, 'business', 2_000)).toBe('agency');
    expect(resolveSelfDeletedReactivationType(deletedProfile, 'business')).toBe('business');
    expect(resolveSelfDeletedReactivationType({ ...deletedProfile, disabled: false }, 'business')).toBe(null);
  });

  it('builds a recreation update that clears deletion state and resets type', () => {
    const update = buildRecreatedAccountProfileUpdate('business', '__delete__');
    expect(update).toEqual(expect.objectContaining({
      accountType: 'business',
      role: 'business',
      accountTypeLocked: true,
      accountTypeSource: 'reactivation',
      disabled: false,
      moderationStatus: 'active',
      publicProfileEnabled: true,
      deletedAt: '__delete__',
      pendingReactivation: '__delete__',
    }));
  });

  it('keeps normal locked accounts on their existing account type', () => {
    expect(resolveBootstrapAccountType({
      forcedOwner: false,
      existingAccountType: 'talent',
      requestedType: 'business',
      reactivationType: null,
    })).toBe('talent');
  });

  it('preserves forced owner bootstrap behavior', () => {
    expect(resolveBootstrapAccountType({
      forcedOwner: true,
      existingAccountType: 'talent',
      requestedType: 'agency',
      reactivationType: 'business',
    })).toBe('owner');
  });
});
