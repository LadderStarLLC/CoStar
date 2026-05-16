export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { jsonError } from '@/lib/firebaseAdmin';
import {
  BLOG_AI_MODEL,
  buildAiPromptSummary,
  createUniqueBlogSlug,
  generateAiBlogDraft,
  getAuthorName,
  normalizeAiDraftInput,
  requireBlogWriter,
} from '@/lib/blogServer';

export async function POST(req: NextRequest) {
  try {
    const { db, decoded, profile } = await requireBlogWriter(req);
    const body = await req.json().catch(() => ({}));
    const input = normalizeAiDraftInput(body);
    const draft = await generateAiBlogDraft(input);
    const title = draft.title || input.topic;
    const slug = await createUniqueBlogSlug(db, title);
    const docRef = db.collection('blogPosts').doc();
    const now = FieldValue.serverTimestamp();

    await docRef.set({
      title,
      slug,
      excerpt: draft.excerpt,
      contentJson: draft.contentJson,
      status: 'draft',
      authorUid: decoded.uid,
      authorName: getAuthorName(profile, decoded),
      source: 'ai',
      reviewStatus: 'needs_review',
      generatedByUid: decoded.uid,
      lastEditedByUid: decoded.uid,
      publishedByUid: null,
      model: BLOG_AI_MODEL,
      promptSummary: buildAiPromptSummary(input),
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });

    return NextResponse.json({ id: docRef.id, slug });
  } catch (err) {
    return jsonError(err);
  }
}
