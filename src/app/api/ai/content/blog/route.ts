export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { blogDocumentToSummary, normalizePublishedBlogPost } from '@/lib/aiContent';
import { requireAiContentAccess } from '@/lib/aiContentAuth';
import { getAdminDb, jsonError } from '@/lib/firebaseAdmin';

const JSON_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

export async function GET(req: NextRequest) {
  const authError = requireAiContentAccess(req);
  if (authError) return authError;

  try {
    const snap = await getAdminDb()
      .collection('blogPosts')
      .where('status', '==', 'published')
      .get();

    const items = snap.docs
      .map((doc) => normalizePublishedBlogPost(doc.id, doc.data()))
      .filter((post): post is NonNullable<typeof post> => Boolean(post))
      .map(blogDocumentToSummary)
      .sort((a, b) => dateValue(b.publishedAt ?? b.updatedAt) - dateValue(a.publishedAt ?? a.updatedAt));

    return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), items }, { headers: JSON_HEADERS });
  } catch (err) {
    return jsonError(err);
  }
}

function dateValue(value?: string | null): number {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
