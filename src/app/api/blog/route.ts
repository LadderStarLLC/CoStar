export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, type Firestore, type Query } from 'firebase-admin/firestore';
import { createBlogSlug } from '@/lib/blog';
import { getCallerProfile, getAdminDb, isPrivilegedType, jsonError, requireAdmin } from '@/lib/firebaseAdmin';

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
    const { db, decoded, profile } = await requireAdmin(req);
    const body = await req.json();
    const title = String(body.title ?? '').trim();
    const excerpt = String(body.excerpt ?? '').trim();
    const contentJson = String(body.contentJson ?? '').trim();
    const status = body.status === 'published' ? 'published' : 'draft';

    if (!title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }
    if (!contentJson) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    }

    const slug = await createUniqueSlug(db, createBlogSlug(title));
    const docRef = db.collection('blogPosts').doc();
    const now = FieldValue.serverTimestamp();

    await docRef.set({
      title,
      slug,
      excerpt,
      contentJson,
      status,
      authorUid: decoded.uid,
      authorName: profile?.displayName || profile?.email || 'CoStar Admin',
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null,
    });

    return NextResponse.json({ id: docRef.id, slug });
  } catch (err) {
    return jsonError(err);
  }
}

async function createUniqueSlug(db: Firestore, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (counter < 100) {
    const snap = await db.collection('blogPosts').where('slug', '==', slug).limit(1).get();
    if (snap.empty) return slug;
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

async function callerCanManageBlog(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  try {
    const { profile } = await getCallerProfile(req);
    return isPrivilegedType(profile?.accountType);
  } catch {
    return false;
  }
}

function timestampValue(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
