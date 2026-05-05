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
      const rawBalance = toSafeBalance(existing.balance);
      let monthlyBalance = toSafeBalance(existing.monthlyBalance ?? 0);
      let foreverBalance = toSafeBalance(existing.foreverBalance ?? 0);

      // Migration: if monthly/forever are both 0 but balance > 0, move balance to monthlyBalance
      if (monthlyBalance === 0 && foreverBalance === 0 && rawBalance > 0) {
        monthlyBalance = rawBalance;
      }

      const balance = monthlyBalance + foreverBalance;

      const normalizedWallet: AccountWallet = {
        uid,
        accountType,
        currency,
        balance,
        monthlyBalance,
        foreverBalance,
        createdAt: serializeTimestamp(existing.createdAt),
        updatedAt: serializeTimestamp(existing.updatedAt),
      };

      if (existing.accountType !== accountType || existing.currency !== currency || existing.monthlyBalance === undefined) {
        transaction.set(walletRef, {
          accountType,
          currency,
          balance,
          monthlyBalance,
          foreverBalance,
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
      monthlyBalance: startingBalance,
      foreverBalance: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    transaction.set(walletRef, walletData);
    return {
      uid,
      accountType,
      currency,
      balance: startingBalance,
      monthlyBalance: startingBalance,
      foreverBalance: 0,
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

    const existing = walletSnap.exists ? (walletSnap.data() as Partial<AccountWallet>) : {};
    const previousMonthly = toSafeBalance(existing.monthlyBalance);
    const previousForever = toSafeBalance(existing.foreverBalance);
    const previousTotal = previousMonthly + previousForever;

    // Default admin adjustment to foreverBalance
    const nextForever = previousForever + delta;
    if (nextForever < 0) {
      throw new Response(JSON.stringify({ error: 'Adjustment would make the forever balance negative.' }), { status: 400 });
    }
    const nextTotal = previousMonthly + nextForever;

    const walletPatch = {
      uid,
      accountType,
      currency,
      balance: nextTotal,
      monthlyBalance: previousMonthly,
      foreverBalance: nextForever,
      updatedAt: FieldValue.serverTimestamp(),
      ...(walletSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    const ledgerEntry: Omit<WalletTransaction, 'id'> = {
      uid,
      accountType,
      currency,
      delta,
      balanceBefore: previousTotal,
      balanceAfter: nextTotal,
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
      balance: nextTotal,
      monthlyBalance: previousMonthly,
      foreverBalance: nextForever,
    };
  });
}

export async function setMonthlyWalletBalance(
  db: Firestore,
  { uid, balance: newMonthly, reason }: WalletSetInput
): Promise<AccountWallet> {
  if (!uid.trim()) {
    throw new Response(JSON.stringify({ error: 'User uid is required.' }), { status: 400 });
  }
  if (!Number.isInteger(newMonthly) || newMonthly < 0) {
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

    const existing = walletSnap.exists ? (walletSnap.data() as Partial<AccountWallet>) : {};
    const previousMonthly = toSafeBalance(existing.monthlyBalance);
    const foreverBalance = toSafeBalance(existing.foreverBalance);
    const delta = newMonthly - previousMonthly;
    const nextTotal = newMonthly + foreverBalance;

    const walletPatch = {
      uid,
      accountType,
      currency,
      balance: nextTotal,
      monthlyBalance: newMonthly,
      foreverBalance,
      updatedAt: FieldValue.serverTimestamp(),
      ...(walletSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    const ledgerEntry: Omit<WalletTransaction, 'id'> = {
      uid,
      accountType,
      currency,
      delta,
      balanceBefore: previousMonthly + foreverBalance,
      balanceAfter: nextTotal,
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
      balance: nextTotal,
      monthlyBalance: newMonthly,
      foreverBalance,
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

    const existing = walletSnap.exists ? (walletSnap.data() as Partial<AccountWallet>) : {};
    const monthly = toSafeBalance(existing.monthlyBalance);
    const forever = toSafeBalance(existing.foreverBalance);
    const total = monthly + forever;

    if (total < amount) {
      throw new Response(JSON.stringify({ error: `Not enough ${currency} remaining.` }), { status: 402 });
    }

    let nextMonthly = monthly;
    let nextForever = forever;

    if (monthly >= amount) {
      nextMonthly -= amount;
    } else {
      nextMonthly = 0;
      nextForever -= (amount - monthly);
    }

    const nextTotal = nextMonthly + nextForever;
    const walletPatch = {
      uid,
      accountType,
      currency,
      balance: nextTotal,
      monthlyBalance: nextMonthly,
      foreverBalance: nextForever,
      updatedAt: FieldValue.serverTimestamp(),
      ...(walletSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    const ledgerEntry: Omit<WalletTransaction, 'id'> = {
      uid,
      accountType,
      currency,
      delta: -amount,
      balanceBefore: total,
      balanceAfter: nextTotal,
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
      balance: nextTotal,
      monthlyBalance: nextMonthly,
      foreverBalance: nextForever,
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

    const existing = walletSnap.exists ? (walletSnap.data() as Partial<AccountWallet>) : {};
    const monthly = toSafeBalance(existing.monthlyBalance);
    const forever = toSafeBalance(existing.foreverBalance);
    const total = monthly + forever;

    if (total < amount) {
      throw new Response(JSON.stringify({ error: `Not enough ${currency} remaining.` }), { status: 402 });
    }

    let reservedFromMonthly = 0;
    let reservedFromForever = 0;

    if (monthly >= amount) {
      reservedFromMonthly = amount;
    } else {
      reservedFromMonthly = monthly;
      reservedFromForever = amount - monthly;
    }

    const nextMonthly = monthly - reservedFromMonthly;
    const nextForever = forever - reservedFromForever;
    const nextTotal = nextMonthly + nextForever;

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
      balance: nextTotal,
      monthlyBalance: nextMonthly,
      foreverBalance: nextForever,
      updatedAt: now,
      ...(walletSnap.exists ? {} : { createdAt: now }),
    }, { merge: true });

    transaction.create(transactionRef, {
      uid,
      accountType,
      currency,
      delta: -amount,
      balanceBefore: total,
      balanceAfter: nextTotal,
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
      reservedMonthly: FieldValue.increment(reservedFromMonthly),
      reservedForever: FieldValue.increment(reservedFromForever),
      usedAmount: 0,
      status: 'reserved',
      reason: trimmedReason,
      metadata: nextMetadata,
      updatedAt: now,
      ...(meterSnap.exists ? {} : { createdAt: now }),
    }, { merge: true });

    return {
      wallet: { uid, accountType, currency, balance: nextTotal, monthlyBalance: nextMonthly, foreverBalance: nextForever },
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
      const wallet = walletSnap.exists ? (walletSnap.data() as Partial<AccountWallet>) : {};
      const monthlyBalance = toSafeBalance(wallet.monthlyBalance);
      const foreverBalance = toSafeBalance(wallet.foreverBalance);
      return {
        wallet: {
          uid,
          accountType: meter.accountType,
          currency: meter.currency,
          balance: monthlyBalance + foreverBalance,
          monthlyBalance,
          foreverBalance,
        },
        transactionId: null,
      };
    }

    const reservedAmount = toSafeBalance(meter.reservedAmount);
    const reservedMonthly = toSafeBalance(meter.reservedMonthly);
    const reservedForever = toSafeBalance(meter.reservedForever);

    const settledUsed = Math.min(usedAmount, reservedAmount);
    const totalRefund = reservedAmount - settledUsed;

    // Logic to refund:
    // If we used 10 and reserved 15 (10 monthly, 5 forever)
    // settledUsed = 10.
    // We should prioritize using monthly first?
    // Actually, when we reserved, we already took monthly first.
    // So when we USE, we should also use monthly first.

    let usedFromMonthly = 0;
    let usedFromForever = 0;
    if (reservedMonthly >= settledUsed) {
      usedFromMonthly = settledUsed;
    } else {
      usedFromMonthly = reservedMonthly;
      usedFromForever = settledUsed - reservedMonthly;
    }

    const refundMonthly = reservedMonthly - usedFromMonthly;
    const refundForever = toSafeBalance(meter.reservedForever) - usedFromForever;

    const wallet = walletSnap.data() as Partial<AccountWallet>;
    const previousMonthly = toSafeBalance(wallet.monthlyBalance);
    const previousForever = toSafeBalance(wallet.foreverBalance);
    const previousTotal = previousMonthly + previousForever;

    const nextMonthly = previousMonthly + refundMonthly;
    const nextForever = previousForever + refundForever;
    const nextTotal = nextMonthly + nextForever;

    const now = FieldValue.serverTimestamp();
    const meterMetadata = isRecord(meter.metadata) ? meter.metadata : {};
    const feature = typeof meterMetadata.feature === 'string' ? meterMetadata.feature : null;
    const sessionId = typeof meterMetadata.sessionId === 'string' ? meterMetadata.sessionId : null;
    const jobTitle = typeof meterMetadata.jobTitle === 'string' ? meterMetadata.jobTitle : null;

    if (totalRefund > 0) {
      transaction.set(walletRef, {
        balance: nextTotal,
        monthlyBalance: nextMonthly,
        foreverBalance: nextForever,
        updatedAt: now,
      }, { merge: true });
      transaction.create(refundRef, {
        uid,
        accountType: meter.accountType,
        currency: meter.currency,
        delta: totalRefund,
        balanceBefore: previousTotal,
        balanceAfter: nextTotal,
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
      usedMonthly: usedFromMonthly,
      usedForever: usedFromForever,
      refundedAmount: totalRefund,
      refundedMonthly: refundMonthly,
      refundedForever: refundForever,
      status: 'settled',
      settledAt: now,
      updatedAt: now,
    }, { merge: true });

    return {
      wallet: {
        uid,
        accountType: meter.accountType,
        currency: meter.currency,
        balance: nextTotal,
        monthlyBalance: nextMonthly,
        foreverBalance: nextForever,
      },
      transactionId: totalRefund > 0 ? refundRef.id : null,
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

    const agencyWallet = agencyWalletSnap.exists ? (agencyWalletSnap.data() as Partial<AccountWallet>) : {};
    const agencyMonthly = toSafeBalance(agencyWallet.monthlyBalance);
    const agencyForever = toSafeBalance(agencyWallet.foreverBalance);
    const agencyTotal = agencyMonthly + agencyForever;

    if (agencyTotal < amount) {
      throw new Response(JSON.stringify({ error: 'Not enough minutes remaining.' }), { status: 402 });
    }

    let giftFromMonthly = 0;
    let giftFromForever = 0;
    if (agencyMonthly >= amount) {
      giftFromMonthly = amount;
    } else {
      giftFromMonthly = agencyMonthly;
      giftFromForever = amount - agencyMonthly;
    }

    const recipientWallet = recipientWalletSnap.exists ? (recipientWalletSnap.data() as Partial<AccountWallet>) : {};
    const recipientMonthly = toSafeBalance(recipientWallet.monthlyBalance);
    const recipientForever = toSafeBalance(recipientWallet.foreverBalance);
    const recipientTotalBefore = recipientMonthly + recipientForever;

    const now = FieldValue.serverTimestamp();
    const agencyNextMonthly = agencyMonthly - giftFromMonthly;
    const agencyNextForever = agencyForever - giftFromForever;
    const agencyNextTotal = agencyNextMonthly + agencyNextForever;

    // Recipients always get gifts as foreverBalance
    const recipientNextForever = recipientForever + amount;
    const recipientNextTotal = recipientMonthly + recipientNextForever;

    transaction.set(agencyWalletRef, {
      uid: agencyUid,
      accountType: 'agency',
      currency: 'minutes',
      balance: agencyNextTotal,
      monthlyBalance: agencyNextMonthly,
      foreverBalance: agencyNextForever,
      updatedAt: now,
      ...(agencyWalletSnap.exists ? {} : { createdAt: now }),
    }, { merge: true });

    transaction.set(recipientWalletRef, {
      uid: resolvedRecipientUid,
      accountType: 'talent',
      currency: 'minutes',
      balance: recipientNextTotal,
      monthlyBalance: recipientMonthly,
      foreverBalance: recipientNextForever,
      updatedAt: now,
      ...(recipientWalletSnap.exists ? {} : { createdAt: now }),
    }, { merge: true });

    transaction.create(agencyTxRef, {
      uid: agencyUid,
      accountType: 'agency',
      currency: 'minutes',
      delta: -amount,
      balanceBefore: agencyTotal,
      balanceAfter: agencyNextTotal,
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
      balanceBefore: recipientTotalBefore,
      balanceAfter: recipientNextTotal,
      reason: trimmedReason,
      actorUid: agencyUid,
      actorEmail: null,
      type: 'gift_received',
      createdAt: now,
    } satisfies Omit<WalletTransaction, 'id'>);

    return {
      agencyWallet: {
        uid: agencyUid,
        accountType: 'agency' as const,
        currency: 'minutes' as const,
        balance: agencyNextTotal,
        monthlyBalance: agencyNextMonthly,
        foreverBalance: agencyNextForever,
      },
      recipientWallet: {
        uid: resolvedRecipientUid,
        accountType: 'talent' as const,
        currency: 'minutes' as const,
        balance: recipientNextTotal,
        monthlyBalance: recipientMonthly,
        foreverBalance: recipientNextForever,
      },
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
