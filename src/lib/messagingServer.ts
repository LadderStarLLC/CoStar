import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { COSTAR_AI_UID, getCoStarParticipant, type Participant } from './messaging';
import { getPublicProfilePath, type PublicAccountType } from './profile';

export const COSTAR_MODEL = 'gemini-3.1-flash-lite-preview';

export function stripUndefined<T extends Record<string, any>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

export function normalizePublicAccountType(value: unknown): PublicAccountType | null {
  if (value === 'user') return 'talent';
  if (value === 'talent' || value === 'business' || value === 'agency') return value;
  return null;
}

export function normalizePreviewText(value: unknown, maxLength = 600): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function safeJsonString(value: unknown, maxLength = 20000): string {
  const raw = typeof value === 'string' ? value : JSON.stringify(value ?? {});
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new Response(JSON.stringify({ error: 'Message content is empty or too long.' }), { status: 400 });
  }
  try {
    JSON.parse(trimmed);
  } catch {
    throw new Response(JSON.stringify({ error: 'Message content must be serialized TipTap JSON.' }), { status: 400 });
  }
  return trimmed;
}

export function textToTipTapJson(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 24);

  return JSON.stringify({
    type: 'doc',
    content: (paragraphs.length ? paragraphs : ['']).map((paragraph) => ({
      type: 'paragraph',
      content: paragraph ? [{ type: 'text', text: paragraph }] : [],
    })),
  });
}

export async function getCallerParticipant(
  db: Firestore,
  decoded: DecodedIdToken,
): Promise<Participant> {
  const snap = await db.doc(`users/${decoded.uid}`).get();
  const data = snap.exists ? snap.data() ?? {} : {};
  const accountType = normalizeAccountType(data.accountType) ?? 'talent';
  const publicSnap = await db.doc(`publicProfiles/${decoded.uid}`).get();
  const publicData = publicSnap.exists ? publicSnap.data() ?? {} : {};
  const publicAccountType = normalizePublicAccountType(publicData.accountType);
  const fields = publicData.fields ?? {};
  const slug = publicData.slug || decoded.uid;

  return {
    uid: decoded.uid,
    name: fields.displayName || data.displayName || decoded.name || decoded.email || 'LadderStar user',
    avatarUrl: fields.photoURL || data.photoURL || decoded.picture || null,
    role: accountType,
    profileUrl: publicAccountType ? getPublicProfilePath(publicAccountType, slug) : null,
  };
}

export async function getPublicProfileParticipant(db: Firestore, uid: string): Promise<Participant | null> {
  const snap = await db.doc(`publicProfiles/${uid}`).get();
  if (!snap.exists) return null;

  const data = snap.data() ?? {};
  const accountType = normalizePublicAccountType(data.accountType);
  if (!accountType || data.status !== 'published' || data.searchable !== true || data.moderationStatus !== 'active') {
    return null;
  }

  const fields = data.fields ?? {};
  return {
    uid,
    name: titleForProfile(data),
    avatarUrl: fields.photoURL || null,
    role: accountType,
    profileUrl: getPublicProfilePath(accountType, data.slug || uid),
  };
}

export function humanConversationId(uidA: string, uidB: string): string {
  return `human_${[uidA, uidB].sort().join('_')}`;
}

export function aiConversationTitle(title?: string): string {
  const normalized = normalizePreviewText(title, 60);
  return normalized || 'Co-Star chat';
}

export async function writeChatEvent(db: Firestore, conversationId: string, event: Record<string, any>) {
  await db.collection(`conversations/${conversationId}/events`).add(stripUndefined({
    ...event,
    createdAt: FieldValue.serverTimestamp(),
  }));
}

export async function appendMessage(input: {
  db: Firestore;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'assistant' | 'system';
  content: string;
  previewText: string;
  readBy: string[];
  deliveredTo?: string[];
  deliveryStatus?: 'sent' | 'delivered' | 'failed';
  ai?: Record<string, unknown>;
}) {
  const messageRef = input.db.collection(`conversations/${input.conversationId}/messages`).doc();
  const message = stripUndefined({
    senderId: input.senderId,
    senderType: input.senderType,
    content: input.content,
    previewText: input.previewText,
    createdAt: FieldValue.serverTimestamp(),
    readBy: input.readBy,
    deliveredTo: input.deliveredTo ?? [],
    deliveryStatus: input.deliveryStatus ?? 'sent',
    ai: input.ai,
  });
  await messageRef.set(message);
  return messageRef.id;
}

export function titleForProfile(data: FirebaseFirestore.DocumentData): string {
  const fields = data.fields ?? {};
  if (data.accountType === 'business') return fields.businessProfile?.companyName || fields.displayName || 'Unnamed Business';
  if (data.accountType === 'agency') return fields.agencyProfile?.agencyName || fields.displayName || 'Unnamed Agency';
  return fields.displayName || 'Unnamed Talent';
}

function normalizeAccountType(value: unknown): Participant['role'] | null {
  if (value === 'user') return 'talent';
  if (['talent', 'business', 'agency', 'admin', 'owner'].includes(String(value))) {
    return value as Participant['role'];
  }
  return null;
}

export function coStarConversationParticipants(user: Participant) {
  return {
    [user.uid]: user,
    [COSTAR_AI_UID]: getCoStarParticipant(),
  };
}

export function timestampToIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  const maybeDate = (value as any)?.toDate?.();
  return maybeDate instanceof Date ? maybeDate.toISOString() : null;
}
