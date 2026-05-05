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
    if (data.status === 'blocked') {
      return NextResponse.json({ error: 'This conversation is blocked.' }, { status: 400 });
    }

    await conversationRef.update({
      archivedBy: FieldValue.arrayUnion(decoded.uid),
      [`archivedAtBy.${decoded.uid}`]: FieldValue.serverTimestamp(),
      unreadBy: FieldValue.arrayRemove(decoded.uid),
    });

    await writeChatEvent(db, params.conversationId, {
      type: 'conversation.archived',
      actorId: decoded.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
