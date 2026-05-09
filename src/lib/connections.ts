import {
  doc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AccountType } from './profile';
import { isSoftDeleted } from './softDelete';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'removed';

export interface ConnectionRecord {
  id: string;
  requesterId: string;
  targetId: string;
  requesterRole: AccountType;
  targetRole: AccountType;
  status: ConnectionStatus;
  createdAt: any;
  updatedAt: any;
  deletedAt?: any;
  deletedBy?: string | null;
}

export interface Connection {
  id: string;
  initiatedBy: string;
  recipientId: string;
  status: 'pending' | 'connected';
}

export function getConnectionLabel(viewerRole: AccountType, targetRole: AccountType, status?: ConnectionStatus | null): string {
  if (viewerRole === 'talent' && targetRole === 'talent') return status === 'accepted' ? 'Synced' : 'Sync';
  if (viewerRole === 'talent' && targetRole === 'business') return status ? 'Tracking' : 'Track'; // one-way
  if (viewerRole === 'business' && targetRole === 'talent') return status === 'accepted' ? 'Aligned' : 'Shortlist';
  if (viewerRole === 'talent' && targetRole === 'agency') return status === 'accepted' ? 'Represented' : 'Apply';
  if (viewerRole === 'agency' && targetRole === 'talent') return status === 'accepted' ? 'Roster' : 'Scout';
  if (viewerRole === 'agency' && targetRole === 'business') return status === 'accepted' ? 'Partnered' : 'Partner';
  return 'Connect';
}

export async function getConnection(viewerId: string, targetId: string): Promise<ConnectionRecord | null> {
  if (!db) throw new Error('Firestore not initialized');
  const connectionsRef = collection(db, 'connections');
  
  // Check if viewer requested target
  const q1 = query(connectionsRef, where('requesterId', '==', viewerId), where('targetId', '==', targetId));
  const snap1 = await getDocs(q1);
  const firstMatch = snap1.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as ConnectionRecord))
    .find(isActiveConnection);
  if (firstMatch) return firstMatch;

  // Check if target requested viewer
  const q2 = query(connectionsRef, where('requesterId', '==', targetId), where('targetId', '==', viewerId));
  const snap2 = await getDocs(q2);
  const secondMatch = snap2.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as ConnectionRecord))
    .find(isActiveConnection);
  if (secondMatch) return secondMatch;

  return null;
}

export function isActiveConnection(connection: ConnectionRecord): boolean {
  return !isSoftDeleted(connection) && connection.status !== 'removed';
}

export async function getConnectionStatus(viewerId: string, targetId: string): Promise<Connection | null> {
  const connection = await getConnection(viewerId, targetId);
  if (!connection) return null;

  return {
    id: connection.id,
    initiatedBy: connection.requesterId,
    recipientId: connection.targetId,
    status: connection.status === 'accepted' ? 'connected' : 'pending',
  };
}

export async function sendConnect(requesterId: string, targetId: string): Promise<void> {
  await requestConnection(requesterId, targetId, 'talent', 'talent');
}

export async function acceptConnect(currentUid: string, targetUid: string): Promise<void> {
  const connection = await getConnection(currentUid, targetUid);
  if (!connection) return;
  await updateConnectionStatus(connection.id, 'accepted');
}

export async function removeConnect(currentUid: string, targetUid: string): Promise<void> {
  const connection = await getConnection(currentUid, targetUid);
  if (!connection) return;
  await removeConnection(connection.id);
}

export async function requestConnection(
  requesterId: string,
  targetId: string,
  requesterRole: AccountType,
  targetRole: AccountType,
  autoAccept: boolean = false
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const connectionsRef = collection(db, 'connections');
  const existing = await getConnection(requesterId, targetId);
  
  if (existing) {
    if (existing.status === 'pending' && autoAccept) {
       await updateDoc(doc(db, 'connections', existing.id), {
         status: 'accepted',
         updatedAt: serverTimestamp()
       });
    }
    return;
  }
  
  const newRef = doc(connectionsRef);
  await setDoc(newRef, {
    id: newRef.id,
    requesterId,
    targetId,
    requesterRole,
    targetRole,
    status: autoAccept ? 'accepted' : 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateConnectionStatus(connectionId: string, status: ConnectionStatus): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  await updateDoc(doc(db, 'connections', connectionId), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function removeConnection(connectionId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  await updateDoc(doc(db, 'connections', connectionId), {
    status: 'removed',
    deletedAt: serverTimestamp(),
    deletedBy: null,
    deletionReason: 'User removed connection.',
    deleteSource: 'user',
    updatedAt: serverTimestamp(),
  });
}
