import type { JSONContent } from '@tiptap/react';

export type BlogPostStatus = 'draft' | 'published';
export type BlogPostSource = 'human' | 'ai';
export type BlogPostReviewStatus = 'needs_review' | 'approved' | 'changes_requested';
export type BlogRole = 'writer' | 'publisher';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentJson: string;
  status: BlogPostStatus;
  authorUid: string;
  authorName: string;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  source?: BlogPostSource;
  reviewStatus?: BlogPostReviewStatus;
  generatedByUid?: string;
  lastEditedByUid?: string;
  publishedByUid?: string;
  model?: string;
  promptSummary?: string;
}

export interface BlogPermissions {
  canReadDrafts: boolean;
  canWriteDrafts: boolean;
  canPublish: boolean;
}

export function normalizeBlogRole(value: unknown): BlogRole | null {
  return value === 'writer' || value === 'publisher' ? value : null;
}

export function getBlogPermissions(profile?: Record<string, unknown> | null): BlogPermissions {
  const accountType = String(profile?.accountType ?? '');
  const blogRole = normalizeBlogRole(profile?.blogRole);
  const isPrivileged = accountType === 'admin' || accountType === 'owner';
  const canPublish = isPrivileged || blogRole === 'publisher';
  const canWriteDrafts = canPublish || blogRole === 'writer';

  return {
    canReadDrafts: canWriteDrafts,
    canWriteDrafts,
    canPublish,
  };
}

export const EMPTY_BLOG_CONTENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

export function createBlogSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'post';
}

export function safeParseBlogContent(contentJson?: string | null): JSONContent {
  if (!contentJson) return EMPTY_BLOG_CONTENT;

  try {
    const parsed = JSON.parse(contentJson);
    if (parsed && typeof parsed === 'object') return parsed as JSONContent;
  } catch {
    return EMPTY_BLOG_CONTENT;
  }

  return EMPTY_BLOG_CONTENT;
}

export function serializeBlogTimestamp(value: any): string | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
