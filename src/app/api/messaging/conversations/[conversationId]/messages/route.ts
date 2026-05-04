import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, jsonError, verifyBearerToken } from '@/lib/firebaseAdmin';
import {
  appendMessage,
  normalizePreviewText,
  safeJsonString,
  writeChatEvent,
} from '@/lib/messagingServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } },
) {
  try {
    const decoded = await verifyBearerToken(req);
    const body = await req.json().catch(() => ({}));
    const db = getAdminDb();
    const conversationRef = db.collection('conversations').doc(params.conversationId);
    const conversationSnap = await conversationRef.get();
    if (!conversationSnap.exists) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    const conversation = conversationSnap.data() ?? {};
    const participantIds = Array.isArray(conversation.participantIds) ? conversation.participantIds : [];
    if (!participantIds.includes(decoded.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (conversation.status !== 'active') {
      return NextResponse.json({ error: 'This conversation is not active.' }, { status: 400 });
    }

    const content = safeJsonString(body.content);
    const previewText = normalizePreviewText(body.previewText, 300);
    if (!previewText) {
      return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
    }

    const recipientIds = participantIds.filter((id: string) => id !== decoded.uid);
    const messageId = await appendMessage({
      db,
      conversationId: params.conversationId,
      senderId: decoded.uid,
      senderType: 'user',
      content,
      previewText,
      readBy: [decoded.uid],
      deliveredTo: recipientIds,
      deliveryStatus: 'delivered',
    });

    await conversationRef.update({
      lastMessage: {
        text: previewText,
        senderId: decoded.uid,
        senderType: 'user',
        timestamp: FieldValue.serverTimestamp(),
      },
      lastUpdatedAt: FieldValue.serverTimestamp(),
      unreadBy: recipientIds,
    });
    await writeChatEvent(db, params.conversationId, {
      type: 'message.sent',
      actorId: decoded.uid,
      messageId,
      deliveredTo: recipientIds,
    });

    return NextResponse.json({ ok: true, messageId });
  } catch (err) {
    return jsonError(err);
  }
}
