import type { AccountType, PublicAccountType } from './profile';

const PUBLIC_REACTIVATION_TYPES: PublicAccountType[] = ['talent', 'business', 'agency'];
const DEFAULT_PENDING_REACTIVATION_TTL_MS = 30 * 60 * 1000;

export interface PendingAccountReactivation {
  requestedType?: unknown;
  requestedAt?: unknown;
  requestedAtMs?: unknown;
  reactivationToken?: unknown;
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
  ttlMs = DEFAULT_PENDING_REACTIVATION_TTL_MS,
  reactivationToken?: unknown
): boolean {
  if (!pending || pending.source !== 'self-service') return false;
  if (!normalizePublicReactivationType(pending.requestedType)) return false;
  if (typeof pending.requestedAtMs !== 'number') return false;
  if (reactivationToken !== undefined && (
    typeof pending.reactivationToken !== 'string' ||
    pending.reactivationToken !== reactivationToken
  )) return false;
  return pending.requestedAtMs <= nowMs && nowMs - pending.requestedAtMs <= ttlMs;
}

export type DeletedAccountReactivationErrorCode =
  | 'DELETED_ACCOUNT_REACTIVATION_REQUIRED'
  | 'DELETED_ACCOUNT_REACTIVATION_EXPIRED'
  | 'DELETED_ACCOUNT_REACTIVATION_INVALID';

export interface DeletedAccountReactivationResolution {
  requestedType: PublicAccountType | null;
  errorCode: DeletedAccountReactivationErrorCode | null;
}

export function resolvePendingDeletedAccountReactivation(input: {
  profile: ReactivationProfileLike | null | undefined;
  requestedType: unknown;
  reactivationToken: unknown;
  nowMs?: number;
  ttlMs?: number;
}): DeletedAccountReactivationResolution {
  if (!isSelfDeletedAccount(input.profile)) {
    return { requestedType: null, errorCode: null };
  }

  const requestedType = normalizePublicReactivationType(input.requestedType);
  const pending = input.profile?.pendingReactivation;
  if (!requestedType || typeof input.reactivationToken !== 'string' || !pending) {
    return { requestedType: null, errorCode: 'DELETED_ACCOUNT_REACTIVATION_REQUIRED' };
  }

  if (pending.source !== 'self-service' || normalizePublicReactivationType(pending.requestedType) !== requestedType) {
    return { requestedType: null, errorCode: 'DELETED_ACCOUNT_REACTIVATION_INVALID' };
  }

  if (pending.reactivationToken !== input.reactivationToken) {
    return { requestedType: null, errorCode: 'DELETED_ACCOUNT_REACTIVATION_INVALID' };
  }

  const nowMs = input.nowMs ?? Date.now();
  const ttlMs = input.ttlMs ?? DEFAULT_PENDING_REACTIVATION_TTL_MS;
  if (!isPendingReactivationFresh(pending, nowMs, ttlMs, input.reactivationToken)) {
    return { requestedType: null, errorCode: 'DELETED_ACCOUNT_REACTIVATION_EXPIRED' };
  }

  return { requestedType, errorCode: null };
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
    publicDraft: {
      status: 'draft' as const,
      searchable: true,
      updatedAt: accountTypeLockedAt,
    },
    deletedAt: deleteField,
    deletedBy: deleteField,
    deletionReason: deleteField,
    deleteSource: deleteField,
    pendingReactivation: deleteField,
    businessProfile: deleteField,
    agencyProfile: deleteField,
    talentProfile: deleteField,
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
