export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAiContentAccess } from '@/lib/aiContentAuth';
import { PUBLIC_SITE_PAGES, blogDocumentToSummary, normalizePublishedBlogPost, toPageSummary } from '@/lib/aiContent';
import { getAdminDb, jsonError } from '@/lib/firebaseAdmin';

const JSON_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

export async function GET(req: NextRequest) {
  const authError = requireAiContentAccess(req);
  if (authError) return authError;

  try {
    const warnings: string[] = [];
    const pageItems = PUBLIC_SITE_PAGES.map((page) => toPageSummary(page));
    const blogItems = await loadPublishedBlogSummaries().catch((error) => {
      warnings.push(error instanceof Error ? error.message : 'Unable to load published blog posts.');
      return [];
    });

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      items: [...pageItems, ...blogItems],
      warnings,
    }, { headers: JSON_HEADERS });
  } catch (err) {
    return jsonError(err);
  }
}

async function loadPublishedBlogSummaries() {
  const snap = await getAdminDb()
    .collection('blogPosts')
    .where('status', '==', 'published')
    .get();

  return snap.docs
    .map((doc) => normalizePublishedBlogPost(doc.id, doc.data()))
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .map(blogDocumentToSummary)
    .sort((a, b) => dateValue(b.publishedAt ?? b.updatedAt) - dateValue(a.publishedAt ?? a.updatedAt));
}

function dateValue(value?: string | null): number {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
