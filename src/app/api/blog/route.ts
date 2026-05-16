export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, type Query } from 'firebase-admin/firestore';
import { getAdminDb, jsonError } from '@/lib/firebaseAdmin';
import {
  buildHumanBlogMetadata,
  callerCanManageBlog,
  createUniqueBlogSlug,
  getAuthorName,
  requireBlogWriter,
} from '@/lib/blogServer';

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const slug = req.nextUrl.searchParams.get('slug')?.trim();
    const includeDrafts = await callerCanManageBlog(req);
    let ref: Query = db.collection('blogPosts');

    if (slug) {
      ref = ref.where('slug', '==', slug);
    }
    if (!includeDrafts) {
      ref = ref.where('status', '==', 'published');
    }

    const snap = await ref.get();
    const posts = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((post: any) => includeDrafts || post.status === 'published')
      .sort((a: any, b: any) => timestampValue(b.publishedAt ?? b.updatedAt) - timestampValue(a.publishedAt ?? a.updatedAt));

    return NextResponse.json({ posts });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db, decoded, profile, permissions } = await requireBlogWriter(req);
    const body = await req.json();
    const title = String(body.title ?? '').trim();
    const excerpt = String(body.excerpt ?? '').trim();
    const contentJson = String(body.contentJson ?? '').trim();
    const status = body.status === 'published' ? 'published' : 'draft';
    const publishNow = status === 'published';

    if (!title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }
    if (!contentJson) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    }
    if (publishNow && !permissions.canPublish) {
      return NextResponse.json({ error: 'Blog publisher access required.' }, { status: 403 });
    }

    const slug = await createUniqueBlogSlug(db, title);
    const docRef = db.collection('blogPosts').doc();
    const now = FieldValue.serverTimestamp();

    await docRef.set({
      title,
      slug,
      excerpt,
      contentJson,
      status,
      authorUid: decoded.uid,
      authorName: getAuthorName(profile, decoded),
      createdAt: now,
      updatedAt: now,
      ...buildHumanBlogMetadata(decoded, publishNow),
    });

    return NextResponse.json({ id: docRef.id, slug });
  } catch (err) {
    return jsonError(err);
  }
}

function timestampValue(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
