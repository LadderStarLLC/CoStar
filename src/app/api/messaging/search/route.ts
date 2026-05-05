import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, jsonError, verifyBearerToken } from '@/lib/firebaseAdmin';
import { COSTAR_AI_UID } from '@/lib/messaging';
import {
  getPublicProfileParticipant,
  normalizePublicAccountType,
  normalizePreviewText,
  titleForProfile,
} from '@/lib/messagingServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const decoded = await verifyBearerToken(req);
    const q = normalizePreviewText(req.nextUrl.searchParams.get('q'), 80).toLowerCase();
    if (q.length < 2) {
      return NextResponse.json([
        {
          type: 'ai',
          id: COSTAR_AI_UID,
          title: 'Co-Star AI',
          subtitle: 'Career search, LadderStar, and small work tasks',
          image: null,
        },
      ]);
    }

    const db = getAdminDb();
    const results: any[] = [];

    const conversationsSnap = await db.collection('conversations')
      .where('participantIds', 'array-contains', decoded.uid)
      .get();
    conversationsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'blocked') return;
      if (Array.isArray(data.archivedBy) && data.archivedBy.includes(decoded.uid)) return;
      const participantIds = Array.isArray(data.participantIds) ? data.participantIds : [];
      const otherId = data.conversationType === 'ai'
        ? COSTAR_AI_UID
        : participantIds.find((id: string) => id !== decoded.uid);
      const participant = otherId ? data.participants?.[otherId] : null;
      const title = data.conversationType === 'ai'
        ? data.ai?.title || 'Co-Star AI'
        : participant?.name || 'Conversation';
      const subtitle = data.lastMessage?.text || (data.conversationType === 'ai' ? 'Co-Star AI thread' : participant?.role);
      const haystack = `${title} ${subtitle}`.toLowerCase();
      if (!haystack.includes(q)) return;
      results.push({
        type: 'conversation',
        id: doc.id,
        title,
        subtitle,
        image: participant?.avatarUrl || null,
        conversationType: data.conversationType || 'human',
      });
    });

    const connectionUids = new Set<string>();
    const requesterSnap = await db.collection('connections')
      .where('requesterId', '==', decoded.uid)
      .where('status', '==', 'accepted')
      .get();
    requesterSnap.forEach((doc) => {
      const targetId = doc.data().targetId;
      if (typeof targetId === 'string') connectionUids.add(targetId);
    });
    const targetSnap = await db.collection('connections')
      .where('targetId', '==', decoded.uid)
      .where('status', '==', 'accepted')
      .get();
    targetSnap.forEach((doc) => {
      const requesterId = doc.data().requesterId;
      if (typeof requesterId === 'string') connectionUids.add(requesterId);
    });

    for (const uid of Array.from(connectionUids).slice(0, 30)) {
      const participant = await getPublicProfileParticipant(db, uid);
      if (!participant || participant.uid === decoded.uid) continue;
      const haystack = `${participant.name} ${participant.role}`.toLowerCase();
      if (!haystack.includes(q)) continue;
      results.push({
        type: 'connection',
        id: uid,
        uid,
        title: participant.name,
        subtitle: `Connected ${participant.role}`,
        image: participant.avatarUrl,
        accountType: participant.role,
        profileUrl: participant.profileUrl,
      });
    }

    const profilesSnap = await db.collection('publicProfiles')
      .where('status', '==', 'published')
      .where('searchable', '==', true)
      .get();
    profilesSnap.forEach((doc) => {
      if (doc.id === decoded.uid) return;
      if (results.some((item) => (item.uid && item.uid === doc.id) || (item.type === 'conversation' && item.id.includes(doc.id)))) return;
      const data = doc.data();
      if (data.moderationStatus !== 'active') return;
      const accountType = normalizePublicAccountType(data.accountType);
      if (!accountType) return;
      const fields = data.fields ?? {};
      const title = titleForProfile(data);
      const subtitle = fields.headline || fields.location || fields.businessProfile?.industry || fields.agencyProfile?.description || accountType;
      const haystack = [
        title,
        subtitle,
        fields.bio,
        fields.businessProfile?.description,
        fields.agencyProfile?.description,
        ...(fields.talentProfile?.skills ?? []),
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return;
      results.push({
        type: 'profile',
        id: doc.id,
        uid: doc.id,
        title,
        subtitle,
        image: fields.photoURL || null,
        accountType,
        profileUrl: `/${accountType}/${data.slug || doc.id}`,
      });
    });

    return NextResponse.json(results.slice(0, 25));
  } catch (err) {
    return jsonError(err);
  }
}
