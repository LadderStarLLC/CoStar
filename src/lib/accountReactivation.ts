import type { AccountType, PublicAccountType } from './profile';

const PUBLIC_REACTIVATION_TYPES: PublicAccountType[] = ['talent', 'business', 'agency'];
const DEFAULT_PENDING_REACTIVATION_TTL_MS = 30 * 60 * 1000;

export interface PendingAccountReactivation {
  requestedType?: unknown;
  requestedAt?: unknown;
  requestedAtMs?: unknown;
  source?: unknown;
}

export interface ReactivationProfileLike {
  accountType?: unknown;
  deletedAt?: unknown;
  deleteSource?: unknown;
  disabled?: unknown;
  pendingReactivation?: PendingAccountReactivation | null;
}

export function normalizePublicReactivationType(value: unknown): PublicAccountType | null {
  const normalized = value === 'user' ? 'talent' : value;
  return PUBLIC_REACTIVATION_TYPES.includes(normalized as PublicAccountType)
    ? normalized as PublicAccountType
    : null;
}

export function isSelfDeletedAccount(profile: ReactivationProfileLike | null | undefined): boolean {
  if (!profile?.deletedAt || profile.deleteSource !== 'user' || profile.disabled !== true) return false;
  return profile.accountType !== 'admin' && profile.accountType !== 'owner';
}

export function canStartDeletedAccountReactivation(
  profile: ReactivationProfileLike | null | undefined,
  requestedType: unknown
): requestedType is PublicAccountType {
  return Boolean(isSelfDeletedAccount(profile) && normalizePublicReactivationType(requestedType));
}

export function isPendingReactivationFresh(
  pending: PendingAccountReactivation | null | undefined,
  nowMs = Date.now(),
  ttlMs = DEFAULT_PENDING_REACTIVATION_TTL_MS
): boolean {
  if (!pending || pending.source !== 'self-service') return false;
  if (!normalizePublicReactivationType(pending.requestedType)) return false;
  if (typeof pending.requestedAtMs !== 'number') return false;
  return pending.requestedAtMs <= nowMs && nowMs - pending.requestedAtMs <= ttlMs;
}

export function resolveSelfDeletedReactivationType(
  profile: ReactivationProfileLike | null | undefined,
  requestedType: unknown,
  nowMs = Date.now()
): PublicAccountType | null {
  if (!isSelfDeletedAccount(profile)) return null;
  const pending = profile?.pendingReactivation;
  if (isPendingReactivationFresh(pending, nowMs)) {
    return normalizePublicReactivationType(pending?.requestedType);
  }
  return normalizePublicReactivationType(requestedType);
}

export function buildRecreatedAccountProfileUpdate(
  requestedType: PublicAccountType,
  deleteField: unknown,
  accountTypeLockedAt: unknown = null
) {
  return {
    accountType: requestedType,
    role: requestedType,
    accountTypeLocked: true,
    accountTypeLockedAt,
    accountTypeSource: 'reactivation' as const,
    disabled: false,
    moderationStatus: 'active' as const,
    publicProfileEnabled: true,
    deletedAt: deleteField,
    deletedBy: deleteField,
    deletionReason: deleteField,
    deleteSource: deleteField,
    pendingReactivation: deleteField,
  };
}

export function resolveBootstrapAccountType(input: {
  forcedOwner: boolean;
  existingAccountType?: unknown;
  requestedType?: unknown;
  reactivationType?: PublicAccountType | null;
}): AccountType | null {
  if (input.forcedOwner) return 'owner';
  if (input.reactivationType) return input.reactivationType;
  if (input.existingAccountType === 'user') return 'talent';
  if (input.existingAccountType && ['talent', 'business', 'agency', 'admin', 'owner'].includes(String(input.existingAccountType))) {
    return input.existingAccountType as AccountType;
  }
  return normalizePublicReactivationType(input.requestedType);
}
