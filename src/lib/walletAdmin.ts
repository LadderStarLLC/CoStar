import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { currencyForAccountType, type AccountWallet, type WalletSummary, type WalletTransaction } from './wallet';
import type { AccountType } from './profile';
import { resolveProfileEntitlements } from './entitlements';

type WalletAdjustmentInput = {
  uid: string;
  delta: number;
  reason: string;
  actor: DecodedIdToken;
};

type WalletSetInput = {
  uid: string;
  balance: number;
  reason: string;
};

type WalletUsageInput = {
  uid: string;
  amount: number;
  reason: string;
};

type WalletReservationInput = {
  uid: string;
  amount: number;
  reason: string;
  meterId?: string;
  metadata?: Record<string, unknown>;
};

type WalletReservationSettlementInput = {
  uid: string;
  meterId: string;
  usedAmount: number;
  reason: string;
  status?: string;
  durationSeconds?: number;
};

type WalletGiftInput = {
  agencyUid: string;
  recipientUid?: string;
  recipientEmail?: string;
  amount: number;
  reason: string;
};

export async function getOrCreateWalletSummary(db: Firestore, uid: string): Promise<WalletSummary> {
  const wallet = await db.runTransaction(async (transaction) => {
    const profileRef = db.doc(`users/${uid}`);
    const walletRef = db.doc(`accountWallets/${uid}`);
    const [profileSnap, walletSnap] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(walletRef),
    ]);

    if (!profileSnap.exists) {
      throw new Response(JSON.stringify({ error: 'User profile not found.' }), { status: 404 });
    }

    const profile = profileSnap.data() ?? {};
    const accountType = normalizeWalletAccountType(profile.accountType);
    const currency = currencyForAccountType(accountType);
    if (!accountType || !currency) return null;
    const resolved = resolveProfileEntitlements(profile);
    const startingBalance = resolved?.monthlyAllowance ?? 0;

    if (walletSnap.exists) {
      const existing = walletSnap.data() as Partial<AccountWallet>;
      const normalizedWallet = {
        uid,
        accountType,
        currency,
        balance: toSafeBalance(existing.balance),
        createdAt: serializeTimestamp(existing.createdAt),
        updatedAt: serializeTimestamp(existing.updatedAt),
      };

      if (existing.accountType !== accountType || existing.currency !== currency) {
        transaction.set(walletRef, {
          accountType,
          currency,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      return normalizedWallet;
    }

    const walletData = {
      uid,
      accountType,
      currency,
      balance: startingBalance,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    transaction.set(walletRef, walletData);
    return {
      uid,
      accountType,
      currency,
      balance: startingBalance,
    };
  });

  const transactions = wallet
    ? await getRecentWalletTransactions(db, uid)
    : [];

  return { wallet, transactions };
}

export async function adjustWalletBalance(
  db: Firestore,
  { uid, delta, reason, actor }: WalletAdjustmentInput
): Promise<AccountWallet> {
  if (!uid.trim()) {
    throw new Response(JSON.stringify({ error: 'User uid is required.' }), { status: 400 });
  }
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Response(JSON.stringify({ error: 'Delta must be a non-zero integer.' }), { status: 400 });
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason || trimmedReason.length > 240) {
    throw new Response(JSON.stringify({ error: 'Reason is required and must be 240 characters or fewer.' }), { status: 400 });
  }

  return db.runTransaction(async (transaction) => {
    const profileRef = db.doc(`users/${uid}`);
    const walletRef = db.doc(`accountWallets/${uid}`);
    const transactionRef = walletRef.collection('transactions').doc();
    const [profileSnap, walletSnap] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(walletRef),
    ]);

    if (!profileSnap.exists) {
      throw new Response(JSON.stringify({ error: 'User profile not found.' }), { status: 404 });
    }

    const profile = profileSnap.data() ?? {};
    const accountType = normalizeWalletAccountType(profile.accountType);
    const currency = currencyForAccountType(accountType);
    if (!accountType || !currency) {
      throw new Response(JSON.stringify({ error: 'This account type does not support a wallet.' }), { status: 400 });
    }

    const previousBalance = walletSnap.exists
      ? toSafeBalance((walletSnap.data() as Partial<AccountWallet>).balance)
      : 0;
    const nextBalance = previousBalance + delta;
    if (nextBalance < 0) {
      throw new Response(JSON.stringify({ error: 'Adjustment would make the balance negative.' }), { status: 400 });
    }

    const walletPatch = {
      uid,
      accountType,
      currency,
      balance: nextBalance,
      updatedAt: FieldValue.serverTimestamp(),
      ...(walletSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    const ledgerEntry: Omit<WalletTransaction, 'id'> = {
      uid,
      accountType,
      currency,
      delta,
      balanceBefore: previousBalance,
      balanceAfter: nextBalance,
      reason: trimmedReason,
      actorUid: actor.uid,
      actorEmail: actor.email ?? null,
      type: 'admin_adjustment',
      createdAt: FieldValue.serverTimestamp(),
    };

    transaction.set(walletRef, walletPatch, { merge: true });
    transaction.create(transactionRef, ledgerEntry);

    return {
      uid,
      accountType,
      currency,
      balance: nextBalance,
    };
  });
}

export async function setWalletBalance(
  db: Firestore,
  { uid, balance, reason }: WalletSetInput
): Promise<AccountWallet> {
  if (!uid.trim()) {
    throw new Response(JSON.stringify({ error: 'User uid is required.' }), { status: 400 });
  }
  if (!Number.isInteger(balance) || balance < 0) {
    throw new Response(JSON.stringify({ error: 'Balance must be a non-negative integer.' }), { status: 400 });
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason || trimmedReason.length > 240) {
    throw new Response(JSON.stringify({ error: 'Reason is required and must be 240 characters or fewer.' }), { status: 400 });
  }

  return db.runTransaction(async (transaction) => {
    const profileRef = db.doc(`users/${uid}`);
    const walletRef = db.doc(`accountWallets/${uid}`);
    const transactionRef = walletRef.collection('transactions').doc();
    const [profileSnap, walletSnap] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(walletRef),
    ]);

    if (!profileSnap.exists) {
      throw new Response(JSON.stringify({ error: 'User profile not found.' }), { status: 404 });
    }

    const profile = profileSnap.data() ?? {};
    const accountType = normalizeWalletAccountType(profile.accountType);
    const currency = currencyForAccountType(accountType);
    if (!accountType || !currency) {
      throw new Response(JSON.stringify({ error: 'This account type does not support a wallet.' }), { status: 400 });
    }

    const previousBalance = walletSnap.exists
      ? toSafeBalance((walletSnap.data() as Partial<AccountWallet>).balance)
      : 0;
    const delta = balance - previousBalance;

    const walletPatch = {
      uid,
      accountType,
      currency,
      balance,
      updatedAt: FieldValue.serverTimestamp(),
      ...(walletSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    const ledgerEntry: Omit<WalletTransaction, 'id'> = {
      uid,
      accountType,
      currency,
      delta,
      balanceBefore: previousBalance,
      balanceAfter: balance,
      reason: trimmedReason,
      actorUid: 'stripe',
      actorEmail: null,
      type: 'subscription_allowance',
      createdAt: FieldValue.serverTimestamp(),
    };

    transaction.set(walletRef, walletPatch, { merge: true });
    transaction.create(transactionRef, ledgerEntry);

    return {
      uid,
      accountType,
      currency,
      balance,
    };
  });
}

export async function consumeWalletBalance(
  db: Firestore,
  { uid, amount, reason }: WalletUsageInput
): Promise<AccountWallet> {
  if (!uid.trim()) {
    throw new Response(JSON.stringify({ error: 'User uid is required.' }), { status: 400 });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Response(JSON.stringify({ error: 'Usage amount must be a positive integer.' }), { status: 400 });
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason || trimmedReason.length > 240) {
    throw new Response(JSON.stringify({ error: 'Reason is required and must be 240 characters or fewer.' }), { status: 400 });
  }

  return db.runTransaction(async (transaction) => {
    const profileRef = db.doc(`users/${uid}`);
    const walletRef = db.doc(`accountWallets/${uid}`);
    const transactionRef = walletRef.collection('transactions').doc();
    const [profileSnap, walletSnap] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(walletRef),
    ]);

    if (!profileSnap.exists) {
      throw new Response(JSON.stringify({ error: 'User profile not found.' }), { status: 404 });
    }

    const profile = profileSnap.data() ?? {};
    const accountType = normalizeWalletAccountType(profile.accountType);
    const currency = currencyForAccountType(accountType);
    if (!accountType || !currency) {
      throw new Response(JSON.stringify({ error: 'This account type does not support a wallet.' }), { status: 400 });
    }

    const previousBalance = walletSnap.exists
      ? toSafeBalance((walletSnap.data() as Partial<AccountWallet>).balance)
      : 0;
    if (previousBalance < amount) {
      throw new Response(JSON.stringify({ error: `Not enough ${currency} remaining.` }), { status: 402 });
    }

    const nextBalance = previousBalance - amount;
    const walletPatch = {
      uid,
      accountType,
      currency,
      balance: nextBalance,
      updatedAt: FieldValue.serverTimestamp(),
      ...(walletSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    const ledgerEntry: Omit<WalletTransaction, 'id'> = {
      uid,
      accountType,
      currency,
      delta: -amount,
      balanceBefore: previousBalance,
      balanceAfter: nextBalance,
      reason: trimmedReason,
      actorUid: 'system',
      actorEmail: null,
      type: 'usage_debit',
      createdAt: FieldValue.serverTimestamp(),
    };

    transaction.set(walletRef, walletPatch, { merge: true });
    transaction.create(transactionRef, ledgerEntry);

    return {
      uid,
      accountType,
      currency,
      balance: nextBalance,
    };
  });
}

export async function reserveWalletBalance(
  db: Firestore,
  { uid, amount, reason, meterId, metadata }: WalletReservationInput
): Promise<{ wallet: AccountWallet; meterId: string; reservedAmount: number; transactionId: string }> {
  const id = meterId?.trim() || db.collection('auditionMetering').doc().id;
  const trimmedReason = reason.trim();
  if (!uid.trim()) {
    throw new Response(JSON.stringify({ error: 'User uid is required.' }), { status: 400 });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Response(JSON.stringify({ error: 'Reservation amount must be a positive integer.' }), { status: 400 });
  }
  if (!trimmedReason || trimmedReason.length > 240) {
    throw new Response(JSON.stringify({ error: 'Reason is required and must be 240 characters or fewer.' }), { status: 400 });
  }

  const result = await db.runTransaction(async (transaction) => {
    const profileRef = db.doc(`users/${uid}`);
    const walletRef = db.doc(`accountWallets/${uid}`);
    const meterRef = db.doc(`auditionMetering/${id}`);
    const transactionRef = walletRef.collection('transactions').doc();
    const [profileSnap, walletSnap, meterSnap] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(walletRef),
      transaction.get(meterRef),
    ]);

    const existingMeter = meterSnap.exists ? (meterSnap.data() ?? {}) : {};
    if (meterSnap.exists) {
      if (existingMeter.uid !== uid || existingMeter.status !== 'reserved') {
        throw new Response(JSON.stringify({ error: 'Reservation cannot be extended.' }), { status: 400 });
      }
    }

    if (!profileSnap.exists) {
      throw new Response(JSON.stringify({ error: 'User profile not found.' }), { status: 404 });
    }

    const profile = profileSnap.data() ?? {};
    const accountType = normalizeWalletAccountType(profile.accountType);
    const currency = currencyForAccountType(accountType);
    if (!accountType || !currency) {
      throw new Response(JSON.stringify({ error: 'This account type does not support a wallet.' }), { status: 400 });
    }

    const previousBalance = walletSnap.exists
      ? toSafeBalance((walletSnap.data() as Partial<AccountWallet>).balance)
      : 0;
    if (previousBalance < amount) {
      throw new Response(JSON.stringify({ error: `Not enough ${currency} remaining.` }), { status: 402 });
    }

    const nextBalance = previousBalance - amount;
    const now = FieldValue.serverTimestamp();
    const existingMetadata = isRecord(existingMeter.metadata) ? existingMeter.metadata : {};
    const nextMetadata = { ...existingMetadata, ...(metadata ?? {}) };
    const feature = typeof nextMetadata.feature === 'string' ? nextMetadata.feature : null;
    const sessionId = typeof nextMetadata.sessionId === 'string' ? nextMetadata.sessionId : null;
    const jobTitle = typeof nextMetadata.jobTitle === 'string' ? nextMetadata.jobTitle : null;
    transaction.set(walletRef, {
      uid,
      accountType,
      currency,
      balance: nextBalance,
      updatedAt: now,
      ...(walletSnap.exists ? {} : { createdAt: now }),
    }, { merge: true });
    transaction.create(transactionRef, {
      uid,
      accountType,
      currency,
      delta: -amount,
      balanceBefore: previousBalance,
      balanceAfter: nextBalance,
      reason: trimmedReason,
      actorUid: 'system',
      actorEmail: null,
      type: 'usage_reserve',
      feature: feature === 'audition' ? 'audition' : null,
      meterId: id,
      sessionId,
      jobTitle,
      metadata: nextMetadata,
      createdAt: now,
    } satisfies Omit<WalletTransaction, 'id'>);
    transaction.set(meterRef, {
      uid,
      accountType,
      currency,
      reservedAmount: FieldValue.increment(amount),
      usedAmount: 0,
      status: 'reserved',
      reason: trimmedReason,
      metadata: nextMetadata,
      updatedAt: now,
      ...(meterSnap.exists ? {} : { createdAt: now }),
    }, { merge: true });

    return {
      wallet: { uid, accountType, currency, balance: nextBalance },
      transactionId: transactionRef.id,
    };
  });

  return { wallet: result.wallet, meterId: id, reservedAmount: amount, transactionId: result.transactionId };
}

export async function settleWalletReservation(
  db: Firestore,
  { uid, meterId, usedAmount, reason, status, durationSeconds }: WalletReservationSettlementInput
): Promise<{ wallet: AccountWallet; transactionId: string | null }> {
  const trimmedReason = reason.trim();
  if (!uid.trim() || !meterId.trim()) {
    throw new Response(JSON.stringify({ error: 'Reservation uid and id are required.' }), { status: 400 });
  }
  if (!Number.isInteger(usedAmount) || usedAmount < 0) {
    throw new Response(JSON.stringify({ error: 'Used amount must be a non-negative integer.' }), { status: 400 });
  }
  if (!trimmedReason || trimmedReason.length > 240) {
    throw new Response(JSON.stringify({ error: 'Reason is required and must be 240 characters or fewer.' }), { status: 400 });
  }

  return db.runTransaction(async (transaction) => {
    const walletRef = db.doc(`accountWallets/${uid}`);
    const meterRef = db.doc(`auditionMetering/${meterId}`);
    const refundRef = walletRef.collection('transactions').doc();
    const [walletSnap, meterSnap] = await Promise.all([
      transaction.get(walletRef),
      transaction.get(meterRef),
    ]);

    if (!meterSnap.exists) {
      throw new Response(JSON.stringify({ error: 'Reservation not found.' }), { status: 404 });
    }
    const meter = meterSnap.data() ?? {};
    if (meter.uid !== uid) {
      throw new Response(JSON.stringify({ error: 'Reservation does not belong to this user.' }), { status: 403 });
    }
    if (meter.status !== 'reserved') {
      return {
        wallet: {
          uid,
          accountType: meter.accountType,
          currency: meter.currency,
          balance: walletSnap.exists ? toSafeBalance((walletSnap.data() as Partial<AccountWallet>).balance) : 0,
        },
        transactionId: null,
      };
    }

    const reservedAmount = toSafeBalance(meter.reservedAmount);
    const settledUsed = Math.min(usedAmount, reservedAmount);
    const refund = reservedAmount - settledUsed;
    const wallet = walletSnap.data() as Partial<AccountWallet>;
    const previousBalance = walletSnap.exists ? toSafeBalance(wallet.balance) : 0;
    const nextBalance = previousBalance + refund;
    const now = FieldValue.serverTimestamp();
    const meterMetadata = isRecord(meter.metadata) ? meter.metadata : {};
    const feature = typeof meterMetadata.feature === 'string' ? meterMetadata.feature : null;
    const sessionId = typeof meterMetadata.sessionId === 'string' ? meterMetadata.sessionId : null;
    const jobTitle = typeof meterMetadata.jobTitle === 'string' ? meterMetadata.jobTitle : null;

    if (refund > 0) {
      transaction.set(walletRef, {
        balance: nextBalance,
        updatedAt: now,
      }, { merge: true });
      transaction.create(refundRef, {
        uid,
        accountType: meter.accountType,
        currency: meter.currency,
        delta: refund,
        balanceBefore: previousBalance,
        balanceAfter: nextBalance,
        reason: trimmedReason,
        actorUid: 'system',
        actorEmail: null,
        type: 'usage_settle_refund',
        feature: feature === 'audition' ? 'audition' : null,
        meterId,
        sessionId,
        jobTitle,
        status: status ?? null,
        durationSeconds: durationSeconds ?? null,
        metadata: meterMetadata,
        createdAt: now,
      } satisfies Omit<WalletTransaction, 'id'>);
    }

    transaction.set(meterRef, {
      usedAmount: settledUsed,
      refundedAmount: refund,
      status: 'settled',
      settledAt: now,
      updatedAt: now,
    }, { merge: true });

    return {
      wallet: {
        uid,
        accountType: meter.accountType,
        currency: meter.currency,
        balance: nextBalance,
      },
      transactionId: refund > 0 ? refundRef.id : null,
    };
  });
}

export async function giftAgencyMinutes(
  db: Firestore,
  { agencyUid, recipientUid, recipientEmail, amount, reason }: WalletGiftInput
): Promise<{ agencyWallet: AccountWallet; recipientWallet: AccountWallet; recipientUid: string }> {
  const trimmedReason = reason.trim();
  if (!agencyUid.trim()) {
    throw new Response(JSON.stringify({ error: 'Agency uid is required.' }), { status: 400 });
  }
  if (!Number.isInteger(amount) || amount <= 0 || amount % 15 !== 0) {
    throw new Response(JSON.stringify({ error: 'Gift amount must be a positive 15-minute interval.' }), { status: 400 });
  }
  if (!trimmedReason || trimmedReason.length > 240) {
    throw new Response(JSON.stringify({ error: 'Reason is required and must be 240 characters or fewer.' }), { status: 400 });
  }

  let resolvedRecipientUid = recipientUid?.trim() ?? '';
  if (!resolvedRecipientUid && recipientEmail?.trim()) {
    const snap = await db.collection('users')
      .where('email', '==', recipientEmail.trim().toLowerCase())
      .limit(1)
      .get();
    resolvedRecipientUid = snap.docs[0]?.id ?? '';
  }
  if (!resolvedRecipientUid) {
    throw new Response(JSON.stringify({ error: 'Talent recipient not found.' }), { status: 404 });
  }

  const result = await db.runTransaction(async (transaction) => {
    const agencyProfileRef = db.doc(`users/${agencyUid}`);
    const recipientProfileRef = db.doc(`users/${resolvedRecipientUid}`);
    const agencyWalletRef = db.doc(`accountWallets/${agencyUid}`);
    const recipientWalletRef = db.doc(`accountWallets/${resolvedRecipientUid}`);
    const agencyTxRef = agencyWalletRef.collection('transactions').doc();
    const recipientTxRef = recipientWalletRef.collection('transactions').doc();
    const [agencyProfileSnap, recipientProfileSnap, agencyWalletSnap, recipientWalletSnap] = await Promise.all([
      transaction.get(agencyProfileRef),
      transaction.get(recipientProfileRef),
      transaction.get(agencyWalletRef),
      transaction.get(recipientWalletRef),
    ]);

    const agencyType = normalizeWalletAccountType(agencyProfileSnap.data()?.accountType);
    const recipientType = normalizeWalletAccountType(recipientProfileSnap.data()?.accountType);
    if (agencyType !== 'agency') {
      throw new Response(JSON.stringify({ error: 'Only Agency accounts can gift minutes.' }), { status: 403 });
    }
    if (recipientType !== 'talent') {
      throw new Response(JSON.stringify({ error: 'Recipient must be a Talent account.' }), { status: 400 });
    }

    const agencyBalance = agencyWalletSnap.exists ? toSafeBalance((agencyWalletSnap.data() as Partial<AccountWallet>).balance) : 0;
    if (agencyBalance < amount) {
      throw new Response(JSON.stringify({ error: 'Not enough minutes remaining.' }), { status: 402 });
    }
    const recipientBalance = recipientWalletSnap.exists ? toSafeBalance((recipientWalletSnap.data() as Partial<AccountWallet>).balance) : 0;
    const now = FieldValue.serverTimestamp();
    const agencyNext = agencyBalance - amount;
    const recipientNext = recipientBalance + amount;

    transaction.set(agencyWalletRef, {
      uid: agencyUid,
      accountType: 'agency',
      currency: 'minutes',
      balance: agencyNext,
      updatedAt: now,
      ...(agencyWalletSnap.exists ? {} : { createdAt: now }),
    }, { merge: true });
    transaction.set(recipientWalletRef, {
      uid: resolvedRecipientUid,
      accountType: 'talent',
      currency: 'minutes',
      balance: recipientNext,
      updatedAt: now,
      ...(recipientWalletSnap.exists ? {} : { createdAt: now }),
    }, { merge: true });
    transaction.create(agencyTxRef, {
      uid: agencyUid,
      accountType: 'agency',
      currency: 'minutes',
      delta: -amount,
      balanceBefore: agencyBalance,
      balanceAfter: agencyNext,
      reason: trimmedReason,
      actorUid: agencyUid,
      actorEmail: null,
      type: 'gift_sent',
      createdAt: now,
    } satisfies Omit<WalletTransaction, 'id'>);
    transaction.create(recipientTxRef, {
      uid: resolvedRecipientUid,
      accountType: 'talent',
      currency: 'minutes',
      delta: amount,
      balanceBefore: recipientBalance,
      balanceAfter: recipientNext,
      reason: trimmedReason,
      actorUid: agencyUid,
      actorEmail: null,
      type: 'gift_received',
      createdAt: now,
    } satisfies Omit<WalletTransaction, 'id'>);

    return {
      agencyWallet: { uid: agencyUid, accountType: 'agency' as const, currency: 'minutes' as const, balance: agencyNext },
      recipientWallet: { uid: resolvedRecipientUid, accountType: 'talent' as const, currency: 'minutes' as const, balance: recipientNext },
    };
  });

  return { ...result, recipientUid: resolvedRecipientUid };
}

async function getRecentWalletTransactions(db: Firestore, uid: string): Promise<WalletTransaction[]> {
  const snap = await db
    .collection(`accountWallets/${uid}/transactions`)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<WalletTransaction, 'id'>),
    createdAt: serializeTimestamp(doc.data().createdAt),
  }));
}

function normalizeWalletAccountType(value: unknown): AccountType | null {
  if (value === 'user') return 'talent';
  if (['talent', 'business', 'agency', 'admin', 'owner'].includes(String(value))) {
    return value as AccountType;
  }
  return null;
}

function toSafeBalance(value: unknown): number {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function serializeTimestamp(value: any): string | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
