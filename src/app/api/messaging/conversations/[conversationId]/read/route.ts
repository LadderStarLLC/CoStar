import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, jsonError, verifyBearerToken } from '@/lib/firebaseAdmin';
import { writeChatEvent } from '@/lib/messagingServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } },
) {
  try {
    const decoded = await verifyBearerToken(req);
    const db = getAdminDb();
    const conversationRef = db.collection('conversations').doc(params.conversationId);
    const snap = await conversationRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });

    const data = snap.data() ?? {};
    const participantIds = Array.isArray(data.participantIds) ? data.participantIds : [];
    if (!participantIds.includes(decoded.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await conversationRef.update({
      unreadBy: FieldValue.arrayRemove(decoded.uid),
      lastReadAtBy: {
        ...(data.lastReadAtBy ?? {}),
        [decoded.uid]: FieldValue.serverTimestamp(),
      },
    });

    const unreadMessages = await conversationRef
      .collection('messages')
      .where('senderId', '!=', decoded.uid)
      .limit(100)
      .get();
    const batch = db.batch();
    unreadMessages.docs.forEach((doc) => {
      const readBy = Array.isArray(doc.data().readBy) ? doc.data().readBy : [];
      if (!readBy.includes(decoded.uid)) {
        batch.update(doc.ref, { readBy: FieldValue.arrayUnion(decoded.uid) });
      }
    });
    await batch.commit();

    await writeChatEvent(db, params.conversationId, {
      type: 'conversation.read',
      actorId: decoded.uid,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
