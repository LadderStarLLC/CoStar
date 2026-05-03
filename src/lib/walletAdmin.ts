import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { currencyForAccountType, type AccountWallet, type WalletSummary, type WalletTransaction } from './wallet';
import type { AccountType } from './profile';

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
      balance: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    transaction.set(walletRef, walletData);
    return {
      uid,
      accountType,
      currency,
      balance: 0,
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
      delta: balance - previousBalance,
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

function serializeTimestamp(value: any): string | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
