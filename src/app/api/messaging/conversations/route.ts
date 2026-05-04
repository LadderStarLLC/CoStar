import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, jsonError, verifyBearerToken } from '@/lib/firebaseAdmin';
import {
  aiConversationTitle,
  appendMessage,
  coStarConversationParticipants,
  getCallerParticipant,
  getPublicProfileParticipant,
  humanConversationId,
  normalizePreviewText,
  textToTipTapJson,
  writeChatEvent,
} from '@/lib/messagingServer';
import { COSTAR_AI_UID } from '@/lib/messaging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const decoded = await verifyBearerToken(req);
    const body = await req.json().catch(() => ({}));
    const db = getAdminDb();
    const caller = await getCallerParticipant(db, decoded);
    const conversationType = body.conversationType === 'ai' ? 'ai' : 'human';

    if (conversationType === 'ai') {
      const conversationRef = db.collection('conversations').doc();
      const title = aiConversationTitle(body.title);
      await conversationRef.set({
        conversationType: 'ai',
        participantIds: [decoded.uid, COSTAR_AI_UID],
        participants: coStarConversationParticipants(caller),
        createdBy: decoded.uid,
        createdAt: FieldValue.serverTimestamp(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
        unreadBy: [],
        status: 'active',
        ai: {
          title,
          model: 'gemini-3.1-flash-lite-preview',
          summary: '',
        },
      });
      const messageId = await appendMessage({
        db,
        conversationId: conversationRef.id,
        senderId: COSTAR_AI_UID,
        senderType: 'assistant',
        content: textToTipTapJson('Hi, I am Co-Star AI. Ask me about LadderStar, career search, hiring, profile strategy, interview prep, or small work tasks.'),
        previewText: 'Hi, I am Co-Star AI. Ask me about LadderStar, career search, hiring, profile strategy, interview prep, or small work tasks.',
        readBy: [COSTAR_AI_UID],
        deliveredTo: [decoded.uid],
        ai: { model: 'gemini-3.1-flash-lite-preview', error: null },
      });
      await conversationRef.update({
        lastMessage: {
          text: 'Hi, I am Co-Star AI. Ask me about LadderStar, career search, hiring, profile strategy, interview prep, or small work tasks.',
          senderId: COSTAR_AI_UID,
          senderType: 'assistant',
          timestamp: FieldValue.serverTimestamp(),
        },
        lastUpdatedAt: FieldValue.serverTimestamp(),
        unreadBy: [decoded.uid],
      });
      await writeChatEvent(db, conversationRef.id, {
        type: 'conversation.created',
        actorId: decoded.uid,
        conversationType: 'ai',
        messageId,
      });
      return NextResponse.json({ conversationId: conversationRef.id });
    }

    const targetUid = normalizePreviewText(body.targetUid, 128);
    if (!targetUid || targetUid === decoded.uid) {
      return NextResponse.json({ error: 'Choose another LadderStar profile to message.' }, { status: 400 });
    }

    const target = await getPublicProfileParticipant(db, targetUid);
    if (!target) {
      return NextResponse.json({ error: 'This profile is not available for messaging.' }, { status: 404 });
    }

    const conversationId = humanConversationId(decoded.uid, targetUid);
    const conversationRef = db.collection('conversations').doc(conversationId);
    const existing = await conversationRef.get();
    if (!existing.exists) {
      await conversationRef.set({
        conversationType: 'human',
        participantIds: [decoded.uid, targetUid].sort(),
        participants: {
          [caller.uid]: caller,
          [target.uid]: target,
        },
        createdBy: decoded.uid,
        createdAt: FieldValue.serverTimestamp(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
        unreadBy: [],
        status: 'active',
      });
      await writeChatEvent(db, conversationId, {
        type: 'conversation.created',
        actorId: decoded.uid,
        conversationType: 'human',
        participantIds: [decoded.uid, targetUid].sort(),
      });
    } else {
      await conversationRef.set({
        participants: {
          [caller.uid]: caller,
          [target.uid]: target,
        },
        lastUpdatedAt: existing.data()?.lastUpdatedAt ?? FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return NextResponse.json({ conversationId });
  } catch (err) {
    return jsonError(err);
  }
}
