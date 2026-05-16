export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { jsonError } from '@/lib/firebaseAdmin';
import { requireBlogWriter } from '@/lib/blogServer';

export async function PATCH(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const { db, decoded, permissions } = await requireBlogWriter(req);
    const postId = params.postId;
    const body = await req.json();
    const postRef = db.collection('blogPosts').doc(postId);
    const snap = await postRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }

    const current = snap.data() ?? {};
    if (current.status === 'published' && !permissions.canPublish) {
      return NextResponse.json({ error: 'Blog publisher access required to edit published posts.' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      lastEditedByUid: decoded.uid,
    };

    if ('title' in body) {
      const title = String(body.title ?? '').trim();
      if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
      updates.title = title;
    }

    if ('excerpt' in body) {
      updates.excerpt = String(body.excerpt ?? '').trim();
    }

    if ('contentJson' in body) {
      const contentJson = String(body.contentJson ?? '').trim();
      if (!contentJson) return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
      updates.contentJson = contentJson;
    }

    if ('status' in body) {
      if (!permissions.canPublish) {
        return NextResponse.json({ error: 'Blog publisher access required.' }, { status: 403 });
      }
      const nextStatus = body.status === 'published' ? 'published' : 'draft';
      updates.status = nextStatus;
      updates.publishedAt = nextStatus === 'published'
        ? current.publishedAt ?? FieldValue.serverTimestamp()
        : null;
      updates.publishedByUid = nextStatus === 'published' ? decoded.uid : null;
      updates.reviewStatus = nextStatus === 'published' ? 'approved' : current.reviewStatus ?? 'needs_review';
    }

    await postRef.update(updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
