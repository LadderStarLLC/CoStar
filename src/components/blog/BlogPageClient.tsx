'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Edit3, FileText, Loader2, Plus, RefreshCw, Sparkles } from 'lucide-react';
import NavHeader from '@/components/NavHeader';
import { BlogEditor } from '@/components/blog/BlogEditor';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import type { BlogPost, BlogPostStatus } from '@/lib/blog';
import { serializeBlogTimestamp } from '@/lib/blog';

type EditorState = { mode: 'new'; post: null } | { mode: 'edit'; post: BlogPost } | null;

export function BlogPageClient() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editorState, setEditorState] = useState<EditorState>(null);
  const [aiDraftInput, setAiDraftInput] = useState({
    topic: '',
    audience: '',
    goal: '',
    keywords: '',
    internalLinks: '/jobs, /audition, /profile, /pricing, /sign-up',
    sourceNotes: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPublish = user?.accountType === 'admin' || user?.accountType === 'owner' || user?.blogRole === 'publisher';
  const canWriteDrafts = canPublish || user?.blogRole === 'writer';

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (auth?.currentUser) {
        headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
      }
      const response = await fetch('/api/blog', { headers, cache: 'no-store' });
      if (!response.ok) throw new Error(await response.text());
      const data: { posts?: Array<Record<string, any>> } = await response.json();
      const next = (data.posts ?? [])
        .map((post: any) => normalizeBlogPost(post.id, post))
        .filter((post: BlogPost) => canWriteDrafts || post.status === 'published')
        .sort((a, b) => dateValue(b.publishedAt ?? b.updatedAt) - dateValue(a.publishedAt ?? a.updatedAt));
      setPosts(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load blog posts.');
    } finally {
      setIsLoading(false);
    }
  }, [canWriteDrafts]);

  useEffect(() => {
    if (!loading) fetchPosts();
  }, [fetchPosts, loading]);

  const selectedPost = useMemo(() => {
    if (editorState?.mode !== 'edit') return null;
    return posts.find((post) => post.id === editorState.post.id) ?? editorState.post;
  }, [editorState, posts]);

  async function savePost(payload: { title: string; excerpt: string; contentJson: string; status: BlogPostStatus }) {
    if (!auth?.currentUser) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const isEdit = editorState?.mode === 'edit';
      const response = await fetch(isEdit ? `/api/blog/${editorState.post.id}` : '/api/blog', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());
      setMessage(payload.status === 'published' ? 'Post published.' : 'Draft saved.');
      setEditorState(null);
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save blog post.');
    } finally {
      setIsSaving(false);
    }
  }

  async function generateAiDraft() {
    if (!auth?.currentUser || !aiDraftInput.topic.trim()) return;

    setIsGenerating(true);
    setMessage(null);
    setError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/blog/ai-drafts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiDraftInput),
      });
      if (!response.ok) throw new Error(await response.text());
      setMessage('AI draft created for human review.');
      setAiDraftInput((current) => ({ ...current, topic: '', sourceNotes: '' }));
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate AI draft.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function setPostStatus(post: BlogPost, status: BlogPostStatus) {
    await saveExistingPost(post, { status });
  }

  async function saveExistingPost(post: BlogPost, patch: Partial<Pick<BlogPost, 'title' | 'excerpt' | 'contentJson' | 'status'>>) {
    if (!auth?.currentUser) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/blog/${post.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error(await response.text());
      setMessage(patch.status === 'published' ? 'Post published.' : 'Post moved to drafts.');
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update blog post.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <NavHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-300">
              <FileText className="h-4 w-4" />
              Blog
            </div>
            <h1 className="text-4xl font-bold text-white">LadderStar Blog</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Interview practice, hiring signals, and platform updates.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPosts}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            {canWriteDrafts && (
              <button
                onClick={() => setEditorState({ mode: 'new', post: null })}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-900 hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" />
                New Post
              </button>
            )}
          </div>
        </div>

        {(message || error) && (
          <div className={`mb-6 rounded-xl border p-4 ${error ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-green-500/30 bg-green-500/10 text-green-300'}`}>
            {error || message}
          </div>
        )}

        {canWriteDrafts && (
          <section className="mb-8 rounded-xl border border-white/10 bg-slate-800/50 p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-bold text-white">
                  <Sparkles className="h-5 w-5 text-amber-300" />
                  AI Draft Queue
                </h2>
                <p className="mt-1 text-sm text-slate-400">Generate a draft for review. AI drafts cannot publish themselves.</p>
              </div>
              <button
                type="button"
                onClick={generateAiDraft}
                disabled={isGenerating || !aiDraftInput.topic.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Draft
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={aiDraftInput.topic}
                onChange={(event) => setAiDraftInput((current) => ({ ...current, topic: event.target.value }))}
                placeholder="Topic"
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <input
                value={aiDraftInput.audience}
                onChange={(event) => setAiDraftInput((current) => ({ ...current, audience: event.target.value }))}
                placeholder="Audience"
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <input
                value={aiDraftInput.goal}
                onChange={(event) => setAiDraftInput((current) => ({ ...current, goal: event.target.value }))}
                placeholder="Goal"
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <input
                value={aiDraftInput.keywords}
                onChange={(event) => setAiDraftInput((current) => ({ ...current, keywords: event.target.value }))}
                placeholder="Keywords"
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <input
                value={aiDraftInput.internalLinks}
                onChange={(event) => setAiDraftInput((current) => ({ ...current, internalLinks: event.target.value }))}
                placeholder="Internal links"
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none md:col-span-2"
              />
              <textarea
                value={aiDraftInput.sourceNotes}
                onChange={(event) => setAiDraftInput((current) => ({ ...current, sourceNotes: event.target.value }))}
                placeholder="Source notes"
                rows={4}
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none md:col-span-2"
              />
            </div>
          </section>
        )}

        {editorState && canWriteDrafts && (
          <div className="mb-8">
            <BlogEditor
              post={selectedPost}
              isSaving={isSaving}
              canPublish={canPublish}
              onCancel={() => setEditorState(null)}
              onSave={savePost}
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-10 text-center text-slate-400">
            No blog posts yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => {
              const canEditPost = canPublish || post.status !== 'published';
              return (
              <article key={post.id} className="rounded-xl border border-white/10 bg-slate-800/50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${post.status === 'published' ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
                        {post.status}
                      </span>
                      {post.source === 'ai' && (
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-300">
                          AI draft
                        </span>
                      )}
                      {post.reviewStatus === 'needs_review' && (
                        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-300">
                          needs review
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{formatDate(post.publishedAt ?? post.updatedAt)}</span>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="text-2xl font-bold text-white hover:text-amber-300">
                      {post.title}
                    </Link>
                    {post.excerpt && <p className="mt-2 max-w-3xl text-slate-400">{post.excerpt}</p>}
                  </div>
                  {canWriteDrafts && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {canEditPost && (
                        <button
                          onClick={() => setEditorState({ mode: 'edit', post })}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                      {canPublish && (
                        <button
                          onClick={() => setPostStatus(post, post.status === 'published' ? 'draft' : 'published')}
                          disabled={isSaving}
                          className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-60"
                        >
                          {post.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            )})}
          </div>
        )}
      </main>
    </div>
  );
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

function formatDate(value: string | null): string {
  if (!value) return 'Not published';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
