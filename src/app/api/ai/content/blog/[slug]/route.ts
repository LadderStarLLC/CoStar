export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { normalizePublishedBlogPost } from '@/lib/aiContent';
import { requireAiContentAccess } from '@/lib/aiContentAuth';
import { getAdminDb, jsonError } from '@/lib/firebaseAdmin';

const JSON_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const authError = requireAiContentAccess(req);
  if (authError) return authError;

  try {
    const slug = decodeURIComponent(params.slug).trim();
    const snap = await getAdminDb()
      .collection('blogPosts')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Published blog post not found.' }, { status: 404, headers: JSON_HEADERS });
    }

    const doc = snap.docs[0];
    const content = normalizePublishedBlogPost(doc.id, doc.data());
    if (!content) {
      return NextResponse.json({ error: 'Published blog post not found.' }, { status: 404, headers: JSON_HEADERS });
    }

    return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), content }, { headers: JSON_HEADERS });
  } catch (err) {
    return jsonError(err);
  }
}
