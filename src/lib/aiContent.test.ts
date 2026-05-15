import { describe, expect, it } from 'vitest';
import {
  canonicalUrl,
  extractInternalLinks,
  getPublicSitePage,
  normalizePublishedBlogPost,
  tipTapJsonToMarkdown,
  tipTapJsonToPlainText,
  toPageDocument,
} from './aiContent';

const contentJson = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Practice plan' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Browse ' },
        { type: 'text', text: 'open jobs', marks: [{ type: 'link', attrs: { href: '/jobs' } }] },
        { type: 'text', text: ' before practice.' },
      ],
    },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prepare one story.' }] }] }] },
  ],
});

describe('AI content serialization', () => {
  it('builds canonical URLs from the configured site URL', () => {
    expect(canonicalUrl('/jobs', { NEXT_PUBLIC_SITE_URL: 'https://preview.ladderstar.com/' } as NodeJS.ProcessEnv)).toBe('https://preview.ladderstar.com/jobs');
  });

  it('serializes TipTap JSON to text and markdown', () => {
    expect(tipTapJsonToPlainText(contentJson)).toContain('Practice plan');
    expect(tipTapJsonToPlainText(contentJson)).toContain('Browse open jobs before practice.');
    expect(tipTapJsonToMarkdown(contentJson)).toContain('## Practice plan');
    expect(tipTapJsonToMarkdown(contentJson)).toContain('[open jobs](/jobs)');
  });

  it('extracts only internal links from TipTap JSON', () => {
    expect(extractInternalLinks(contentJson)).toEqual([{ href: '/jobs', label: 'open jobs' }]);
  });

  it('normalizes only published blog posts', () => {
    const published = normalizePublishedBlogPost('post-1', {
      title: 'Interview practice guide',
      slug: 'interview-practice-guide',
      excerpt: 'Practice clearly.',
      status: 'published',
      contentJson,
      publishedAt: '2026-05-15T00:00:00.000Z',
      updatedAt: '2026-05-15T00:00:00.000Z',
    });

    expect(published).toMatchObject({
      id: 'blog:interview-practice-guide',
      type: 'blogPost',
      path: '/blog/interview-practice-guide',
    });
    expect(normalizePublishedBlogPost('post-2', { status: 'draft', contentJson })).toBeNull();
  });

  it('returns curated public page documents without private operational data', () => {
    const page = getPublicSitePage('/profile');
    expect(page).toBeTruthy();
    const doc = toPageDocument(page!);
    expect(doc.type).toBe('page');
    expect(doc.bodyText).toContain('public career information');
    expect(JSON.stringify(doc)).not.toContain('wallet');
    expect(JSON.stringify(doc)).not.toContain('adminAuditLogs');
  });
});
