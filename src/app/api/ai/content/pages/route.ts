export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPublicSitePage, PUBLIC_SITE_PAGES, toPageDocument } from '@/lib/aiContent';
import { requireAiContentAccess } from '@/lib/aiContentAuth';

const JSON_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

export async function GET(req: NextRequest) {
  const authError = requireAiContentAccess(req);
  if (authError) return authError;

  const requestedPath = req.nextUrl.searchParams.get('path')?.trim();
  if (requestedPath) {
    const page = getPublicSitePage(requestedPath);
    if (!page) return NextResponse.json({ error: 'Public page content not found.' }, { status: 404, headers: JSON_HEADERS });
    return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), content: toPageDocument(page) }, { headers: JSON_HEADERS });
  }

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    items: PUBLIC_SITE_PAGES.map((page) => toPageDocument(page)),
  }, { headers: JSON_HEADERS });
}
