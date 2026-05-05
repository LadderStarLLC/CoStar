import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { AccountType } from './profile';

export const COSTAR_AI_UID = 'costar-ai';

export type ConversationType = 'human' | 'ai';
export type ConversationStatus = 'active' | 'archived' | 'blocked';
export type MessageSenderType = 'user' | 'assistant' | 'system';
export type MessageDeliveryStatus = 'sent' | 'delivered' | 'failed';

export interface Participant {
  uid: string;
  name: string;
  avatarUrl: string | null;
  role: AccountType | 'assistant';
  profileUrl?: string | null;
  isAi?: boolean;
}

export interface LastMessage {
  text: string;
  senderId: string;
  senderType: MessageSenderType;
  timestamp: any;
}

export interface Conversation {
  id: string;
  conversationType: ConversationType;
  participantIds: string[];
  participants: Record<string, Participant>;
  createdBy: string;
  createdAt: any;
  lastMessage?: LastMessage;
  lastUpdatedAt: any;
  unreadBy?: string[];
  archivedBy?: string[];
  archivedAtBy?: Record<string, any>;
  status: ConversationStatus;
  ai?: {
    title?: string;
    model?: string;
    summary?: string;
    lastResponseAt?: any;
  };
}

export interface Message {
  id: string;
  senderId: string;
  senderType: MessageSenderType;
  content: string;
  previewText: string;
  createdAt: any;
  readBy: string[];
  deliveredTo?: string[];
  deliveryStatus?: MessageDeliveryStatus;
  editedAt?: any;
  deletedAt?: any;
  ai?: {
    model?: string;
    latencyMs?: number;
    promptTokenCount?: number | null;
    responseTokenCount?: number | null;
    totalTokenCount?: number | null;
    error?: string | null;
  };
}

export type MessagingSearchResult =
  | {
      type: 'conversation';
      id: string;
      title: string;
      subtitle?: string;
      image?: string | null;
      conversationType: ConversationType;
    }
  | {
      type: 'profile' | 'connection';
      id: string;
      uid: string;
      title: string;
      subtitle?: string;
      image?: string | null;
      accountType: 'talent' | 'business' | 'agency';
      profileUrl?: string | null;
    }
  | {
      type: 'ai';
      id: typeof COSTAR_AI_UID;
      title: string;
      subtitle?: string;
      image?: string | null;
    };

export function getCoStarParticipant(): Participant {
  return {
    uid: COSTAR_AI_UID,
    name: 'Co-Star AI',
    avatarUrl: null,
    role: 'assistant',
    isAi: true,
  };
}

async function authHeaders() {
  const { auth } = await import('./firebase');
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error('You must be signed in to use messaging.');
  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Request failed with ${response.status}`);
  }
  return data as T;
}

export async function createConversation(input: {
  targetUid?: string;
  conversationType?: ConversationType;
  title?: string;
}): Promise<{ conversationId: string }> {
  const response = await fetch('/api/messaging/conversations', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  return parseJsonResponse(response);
}

export async function getOrCreateConversation(targetUid: string): Promise<string> {
  const result = await createConversation({ targetUid, conversationType: 'human' });
  return result.conversationId;
}

export async function createCoStarConversation(title?: string): Promise<string> {
  const result = await createConversation({ conversationType: 'ai', title });
  return result.conversationId;
}

export async function searchMessaging(queryText: string): Promise<MessagingSearchResult[]> {
  const params = new URLSearchParams({ q: queryText });
  const response = await fetch(`/api/messaging/search?${params.toString()}`, {
    headers: await authHeaders(),
  });
  return parseJsonResponse(response);
}

/**
 * Subscribes to all conversations for a specific user.
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) throw new Error('Firestore not initialized');
  const q = query(
    collection(db as any, 'conversations'),
    where('participantIds', 'array-contains', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const convs: Conversation[] = [];
      snapshot.forEach(docSnap => {
        const conversation = { id: docSnap.id, ...docSnap.data() } as Conversation;
        if (!conversation.archivedBy?.includes(userId)) {
          convs.push(conversation);
        }
      });
      convs.sort((a, b) => {
        const timeA = a.lastUpdatedAt?.toMillis?.() ?? 0;
        const timeB = b.lastUpdatedAt?.toMillis?.() ?? 0;
        return timeB - timeA;
      });
      callback(convs);
    },
    onError,
  );
}

/**
 * Subscribes to all messages in a conversation.
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) throw new Error('Firestore not initialized');
  const q = query(
    collection(db as any, `conversations/${conversationId}/messages`),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      callback(msgs);
    },
    onError,
  );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  previewText: string
) {
  void senderId;
  const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ content, previewText }),
  });
  return parseJsonResponse<{ ok: true; messageId: string }>(response);
}

export async function requestCoStarResponse(conversationId: string) {
  const response = await fetch('/api/messaging/ai/respond', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ conversationId }),
  });
  return parseJsonResponse<{ ok: true; messageId: string }>(response);
}

export async function markConversationRead(conversationId: string, userId: string) {
  void userId;
  const response = await fetch(`/api/messaging/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({}),
  });
  return parseJsonResponse<{ ok: true }>(response);
}

export async function archiveConversation(conversationId: string) {
  const response = await fetch(`/api/messaging/conversations/${conversationId}/archive`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({}),
  });
  return parseJsonResponse<{ ok: true }>(response);
}

export function timestampToMillis(value: any): number {
  if (value instanceof Timestamp) return value.toMillis();
  return value?.toMillis?.() ?? 0;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  if (!db) throw new Error('Firestore not initialized');
  const snap = await getDoc(doc(db as any, 'conversations', conversationId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null;
}
