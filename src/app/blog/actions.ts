'use server';

import { getAuth } from 'firebase-admin/auth';
import { FieldValue, type Query } from 'firebase-admin/firestore';
import type { BlogPost, BlogPostStatus } from '@/lib/blog';
import { getBlogPermissions, serializeBlogTimestamp } from '@/lib/blog';
import {
  BLOG_AI_MODEL,
  buildAiPromptSummary,
  buildHumanBlogMetadata,
  createUniqueBlogSlug,
  generateAiBlogDraft,
  getAuthorName,
  normalizeAiDraftInput,
} from '@/lib/blogServer';
import { getAdminApp, getAdminDb } from '@/lib/firebaseAdmin';

type BlogActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type BlogPostPayload = {
  title: string;
  excerpt: string;
  contentJson: string;
  status: BlogPostStatus;
};

export async function listBlogPostsAction(idToken?: string): Promise<BlogActionResult<{ posts: BlogPost[] }>> {
  try {
    const db = getAdminDb();
    const includeDrafts = await canManageBlogFromToken(idToken);
    let ref: Query = db.collection('blogPosts');

    if (!includeDrafts) {
      ref = ref.where('status', '==', 'published');
    }

    const snap = await ref.get();
    const posts = snap.docs
      .map((doc) => normalizeBlogPost(doc.id, doc.data()))
      .filter((post) => includeDrafts || post.status === 'published')
      .sort((a, b) => dateValue(b.publishedAt ?? b.updatedAt) - dateValue(a.publishedAt ?? a.updatedAt));

    return { ok: true, data: { posts } };
  } catch (err) {
    return { ok: false, error: getActionError(err, 'Could not load blog posts.') };
  }
}

export async function getBlogPostBySlugAction(slug: string, idToken?: string): Promise<BlogActionResult<{ post: BlogPost | null }>> {
  try {
    const db = getAdminDb();
    const includeDrafts = await canManageBlogFromToken(idToken);
    const snap = await db.collection('blogPosts').where('slug', '==', slug.trim()).limit(1).get();
    const post = snap.docs[0] ? normalizeBlogPost(snap.docs[0].id, snap.docs[0].data()) : null;

    return {
      ok: true,
      data: { post: post && (includeDrafts || post.status === 'published') ? post : null },
    };
  } catch (err) {
    return { ok: false, error: getActionError(err, 'Could not load this blog post.') };
  }
}

export async function createBlogPostAction(idToken: string, payload: BlogPostPayload): Promise<BlogActionResult<{ id: string; slug: string }>> {
  try {
    const { db, decoded, profile, permissions } = await requireBlogWriterFromToken(idToken);
    const title = String(payload.title ?? '').trim();
    const excerpt = String(payload.excerpt ?? '').trim();
    const contentJson = String(payload.contentJson ?? '').trim();
    const status = payload.status === 'published' ? 'published' : 'draft';
    const publishNow = status === 'published';

    if (!title) throw new Error('Title is required.');
    if (!contentJson) throw new Error('Content is required.');
    if (publishNow && !permissions.canPublish) throw new Error('Blog publisher access required.');

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

    return { ok: true, data: { id: docRef.id, slug } };
  } catch (err) {
    return { ok: false, error: getActionError(err, 'Could not save blog post.') };
  }
}

export async function updateBlogPostAction(
  idToken: string,
  postId: string,
  patch: Partial<Pick<BlogPost, 'title' | 'excerpt' | 'contentJson' | 'status'>>
): Promise<BlogActionResult<{ ok: true }>> {
  try {
    const { db, decoded, permissions } = await requireBlogWriterFromToken(idToken);
    const postRef = db.collection('blogPosts').doc(postId);
    const snap = await postRef.get();

    if (!snap.exists) throw new Error('Blog post not found.');

    const current = snap.data() ?? {};
    if (current.status === 'published' && !permissions.canPublish) {
      throw new Error('Blog publisher access required to edit published posts.');
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      lastEditedByUid: decoded.uid,
    };

    if ('title' in patch) {
      const title = String(patch.title ?? '').trim();
      if (!title) throw new Error('Title is required.');
      updates.title = title;
    }

    if ('excerpt' in patch) updates.excerpt = String(patch.excerpt ?? '').trim();

    if ('contentJson' in patch) {
      const contentJson = String(patch.contentJson ?? '').trim();
      if (!contentJson) throw new Error('Content is required.');
      updates.contentJson = contentJson;
    }

    if ('status' in patch) {
      if (!permissions.canPublish) throw new Error('Blog publisher access required.');
      const nextStatus = patch.status === 'published' ? 'published' : 'draft';
      updates.status = nextStatus;
      updates.publishedAt = nextStatus === 'published'
        ? current.publishedAt ?? FieldValue.serverTimestamp()
        : null;
      updates.publishedByUid = nextStatus === 'published' ? decoded.uid : null;
      updates.reviewStatus = nextStatus === 'published' ? 'approved' : current.reviewStatus ?? 'needs_review';
    }

    await postRef.update(updates);
    return { ok: true, data: { ok: true } };
  } catch (err) {
    return { ok: false, error: getActionError(err, 'Could not update blog post.') };
  }
}

export async function generateAiBlogDraftAction(idToken: string, input: unknown): Promise<BlogActionResult<{ id: string; slug: string }>> {
  try {
    const { db, decoded, profile } = await requireBlogWriterFromToken(idToken);
    const normalizedInput = normalizeAiDraftInput(input);
    const draft = await generateAiBlogDraft(normalizedInput);
    const title = draft.title || normalizedInput.topic;
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
      promptSummary: buildAiPromptSummary(normalizedInput),
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });

    return { ok: true, data: { id: docRef.id, slug } };
  } catch (err) {
    return { ok: false, error: getActionError(err, 'Could not generate AI draft.') };
  }
}

async function canManageBlogFromToken(idToken?: string): Promise<boolean> {
  if (!idToken) return false;
  try {
    const { profile } = await getCallerFromToken(idToken);
    return getBlogPermissions(profile).canReadDrafts;
  } catch {
    return false;
  }
}

async function requireBlogWriterFromToken(idToken: string) {
  const caller = await getCallerFromToken(idToken);
  const permissions = getBlogPermissions(caller.profile);
  if (!permissions.canWriteDrafts) throw new Error('Blog writer access required.');
  return { ...caller, permissions };
}

async function getCallerFromToken(idToken: string) {
  if (!idToken) throw new Error('Unauthorized');
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
  const db = getAdminDb();
  const snap = await db.doc(`users/${decoded.uid}`).get();
  const profile = snap.exists ? snap.data() : null;
  return { decoded, profile, db };
}

function normalizeBlogPost(id: string, data: any): BlogPost {
  return {
    id,
    title: data.title ?? '',
    slug: data.slug ?? id,
    excerpt: data.excerpt ?? '',
    contentJson: data.contentJson ?? '',
    status: data.status === 'published' ? 'published' : 'draft',
    authorUid: data.authorUid ?? '',
    authorName: data.authorName ?? '',
    createdAt: serializeBlogTimestamp(data.createdAt),
    updatedAt: serializeBlogTimestamp(data.updatedAt),
    publishedAt: serializeBlogTimestamp(data.publishedAt),
    source: data.source === 'ai' ? 'ai' : data.source === 'human' ? 'human' : undefined,
    reviewStatus: ['needs_review', 'approved', 'changes_requested'].includes(data.reviewStatus) ? data.reviewStatus : undefined,
    generatedByUid: data.generatedByUid ?? undefined,
    lastEditedByUid: data.lastEditedByUid ?? undefined,
    publishedByUid: data.publishedByUid ?? undefined,
    model: data.model ?? undefined,
    promptSummary: data.promptSummary ?? undefined,
  };
}

function dateValue(value: string | null): number {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getActionError(err: unknown, fallback: string): string {
  if (err instanceof Response) return err.statusText || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

