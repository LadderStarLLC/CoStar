import type { JSONContent } from '@tiptap/react';
import type { BlogPost } from './blog';
import { safeParseBlogContent, serializeBlogTimestamp } from './blog';

export type AiContentType = 'page' | 'blogPost';

export interface AiContentSummary {
  id: string;
  type: AiContentType;
  title: string;
  description: string;
  path: string;
  canonicalUrl: string;
  updatedAt: string | null;
  publishedAt?: string | null;
  tags?: string[];
}

export interface AiContentDocument extends AiContentSummary {
  bodyText: string;
  bodyMarkdown: string;
  internalLinks: Array<{ href: string; label: string }>;
}

export interface PublicSitePageContent {
  path: string;
  title: string;
  description: string;
  bodyText: string;
  tags: string[];
  internalLinks: Array<{ href: string; label: string }>;
}

export const DEFAULT_SITE_URL = 'https://www.ladderstar.com';

export const PUBLIC_SITE_PAGES: PublicSitePageContent[] = [
  {
    path: '/',
    title: 'LadderStar - Job Discovery & AI Interview Practice',
    description: 'Browse curated external roles, publish a professional profile, and practice interviews with LadderStar.',
    bodyText: 'LadderStar helps job seekers build a public professional profile, practice interviews, browse high-signal job opportunities, and become easier for employers to discover and evaluate.',
    tags: ['Job Search', 'Interview Practice', 'Career Profile'],
    internalLinks: [
      { href: '/jobs', label: 'Browse jobs' },
      { href: '/audition', label: 'Practice interviews' },
      { href: '/sign-up', label: 'Create an account' },
    ],
  },
  {
    path: '/jobs',
    title: 'LadderStar Job Board',
    description: 'Premium, scannable listings with focused filters for high-momentum career moves.',
    bodyText: 'The LadderStar job board helps job seekers browse focused role listings and filter opportunities while preparing a stronger profile and clearer interview answers.',
    tags: ['Job Search', 'Career Momentum'],
    internalLinks: [
      { href: '/profile', label: 'Update your profile' },
      { href: '/audition', label: 'Practice before applying' },
    ],
  },
  {
    path: '/audition',
    title: 'AI Interview Practice',
    description: 'Practice job interviews with LadderStar and use feedback to sharpen your answers before real conversations.',
    bodyText: 'LadderStar interview practice helps talent rehearse answers, reduce interview anxiety, and organize real examples for upcoming job conversations.',
    tags: ['Interview Practice', 'AI Interview Practice', 'Behavioral Interviews'],
    internalLinks: [
      { href: '/jobs', label: 'Find roles to prepare for' },
      { href: '/pricing', label: 'Compare plans' },
    ],
  },
  {
    path: '/profile',
    title: 'Public Professional Profile',
    description: 'Build and manage the public professional profile employers can use to understand your career direction and readiness.',
    bodyText: 'LadderStar profiles help job seekers present opted-in public career information, skills, experience, and career direction while keeping private account and operational data private.',
    tags: ['Career Profile', 'Job Search'],
    internalLinks: [
      { href: '/jobs', label: 'Browse jobs' },
      { href: '/sign-up', label: 'Create an account' },
    ],
  },
  {
    path: '/pricing',
    title: 'LadderStar Pricing',
    description: 'Compare LadderStar options for talent, businesses, and agencies.',
    bodyText: 'LadderStar pricing includes free and paid options for talent, businesses, and agencies, with interview practice, profiles, job discovery, and premium workflow features depending on plan.',
    tags: ['Pricing', 'Interview Practice'],
    internalLinks: [
      { href: '/sign-up', label: 'Start free' },
      { href: '/contact', label: 'Contact LadderStar' },
    ],
  },
  {
    path: '/about',
    title: 'About LadderStar',
    description: 'Learn about LadderStar, a professional platform for job discovery, public profiles, AI interview practice, and career momentum.',
    bodyText: 'LadderStar combines job discovery, public profiles, AI interview practice, messaging, account management, and premium career tools in one focused platform for modern hiring and career growth.',
    tags: ['Company', 'Career Momentum'],
    internalLinks: [
      { href: '/jobs', label: 'Explore jobs' },
      { href: '/contact', label: 'Contact us' },
    ],
  },
  {
    path: '/contact',
    title: 'Contact LadderStar',
    description: 'Contact LadderStar for support, privacy, legal, business, and platform questions.',
    bodyText: 'LadderStar provides contact paths for general support, privacy requests, legal questions, and platform inquiries.',
    tags: ['Company', 'Support'],
    internalLinks: [
      { href: '/about', label: 'About LadderStar' },
      { href: '/privacy', label: 'Privacy policy' },
    ],
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'Read how LadderStar handles account, profile, job search, interview practice, messaging, billing, and analytics data.',
    bodyText: 'The LadderStar privacy policy explains how the platform handles Firebase Auth, Firestore profiles, public profile projections, Gemini Live API audition practice, TipTap messaging, Stripe billing, Vercel analytics, admin audit logs, and premium wallets.',
    tags: ['Legal', 'Privacy'],
    internalLinks: [
      { href: '/terms', label: 'Terms of service' },
      { href: '/security', label: 'Security' },
    ],
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    description: 'Read LadderStar terms for using job discovery, profiles, interview practice, messaging, billing, and related platform features.',
    bodyText: 'The LadderStar terms explain platform rules for users, public profiles, job discovery, interview practice, messaging, payments, content, and account responsibilities.',
    tags: ['Legal', 'Terms'],
    internalLinks: [
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/acceptable-use', label: 'Acceptable use' },
    ],
  },
  {
    path: '/security',
    title: 'Security',
    description: 'Read about LadderStar security practices and responsible handling of platform data.',
    bodyText: 'LadderStar security content describes responsible handling of authentication, public profile projections, admin access, billing, messaging, and operational data without claiming unverified certifications.',
    tags: ['Security', 'Legal'],
    internalLinks: [
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/contact', label: 'Contact support' },
    ],
  },
  {
    path: '/ai-policy',
    title: 'AI Policy',
    description: 'Read LadderStar AI policy for interview practice, messaging AI, candidate support, and responsible use boundaries.',
    bodyText: 'The LadderStar AI policy explains how AI tools support interview practice and messaging while avoiding hiring guarantees, appearance-based judgments, and unsupported claims.',
    tags: ['AI Policy', 'Interview Practice'],
    internalLinks: [
      { href: '/audition', label: 'AI interview practice' },
      { href: '/acceptable-use', label: 'Acceptable use' },
    ],
  },
];

export function getSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.NEXT_PUBLIC_SITE_URL || env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
}

export function canonicalUrl(path: string, env: NodeJS.ProcessEnv = process.env): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl(env)}${normalizedPath}`;
}

export function getPublicSitePage(path: string): PublicSitePageContent | undefined {
  const normalizedPath = path === '' ? '/' : path;
  return PUBLIC_SITE_PAGES.find((page) => page.path === normalizedPath);
}

export function toPageDocument(page: PublicSitePageContent, env: NodeJS.ProcessEnv = process.env): AiContentDocument {
  return {
    id: `page:${page.path}`,
    type: 'page',
    title: page.title,
    description: page.description,
    path: page.path,
    canonicalUrl: canonicalUrl(page.path, env),
    updatedAt: null,
    tags: page.tags,
    bodyText: page.bodyText,
    bodyMarkdown: pageToMarkdown(page),
    internalLinks: page.internalLinks,
  };
}

export function toPageSummary(page: PublicSitePageContent, env: NodeJS.ProcessEnv = process.env): AiContentSummary {
  const document = toPageDocument(page, env);
  const { bodyText: _bodyText, bodyMarkdown: _bodyMarkdown, internalLinks: _internalLinks, ...summary } = document;
  return summary;
}

export function normalizePublishedBlogPost(id: string, data: Record<string, any>, env: NodeJS.ProcessEnv = process.env): AiContentDocument | null {
  if (data.status !== 'published') return null;

  const slug = String(data.slug || id).trim();
  if (!slug) return null;

  const bodyText = tipTapJsonToPlainText(String(data.contentJson || ''));
  const bodyMarkdown = tipTapJsonToMarkdown(String(data.contentJson || ''));
  const path = `/blog/${slug}`;
  const title = String(data.title || '').trim();
  const description = String(data.excerpt || '').trim();
  const publishedAt = serializeBlogTimestamp(data.publishedAt);
  const updatedAt = serializeBlogTimestamp(data.updatedAt);

  return {
    id: `blog:${slug}`,
    type: 'blogPost',
    title,
    description,
    path,
    canonicalUrl: canonicalUrl(path, env),
    publishedAt,
    updatedAt,
    tags: Array.isArray(data.tags) ? data.tags.filter((tag: unknown) => typeof tag === 'string') : undefined,
    bodyText,
    bodyMarkdown,
    internalLinks: extractInternalLinks(String(data.contentJson || '')),
  };
}

export function blogDocumentToSummary(document: AiContentDocument): AiContentSummary {
  const { bodyText: _bodyText, bodyMarkdown: _bodyMarkdown, internalLinks: _internalLinks, ...summary } = document;
  return summary;
}

export function blogPostToContentDocument(post: BlogPost, env: NodeJS.ProcessEnv = process.env): AiContentDocument | null {
  return normalizePublishedBlogPost(post.id, post as unknown as Record<string, any>, env);
}

export function tipTapJsonToPlainText(contentJson: string): string {
  const content = safeParseBlogContent(contentJson);
  return renderPlainNodes(content.content ?? []).replace(/\n{3,}/g, '\n\n').trim();
}

export function tipTapJsonToMarkdown(contentJson: string): string {
  const content = safeParseBlogContent(contentJson);
  return renderMarkdownNodes(content.content ?? []).replace(/\n{3,}/g, '\n\n').trim();
}

export function extractInternalLinks(contentJson: string): Array<{ href: string; label: string }> {
  const content = safeParseBlogContent(contentJson);
  const links: Array<{ href: string; label: string }> = [];

  function visit(node: JSONContent): void {
    if (node.type === 'text') {
      node.marks?.forEach((mark) => {
        const href = mark.attrs?.href;
        if (mark.type === 'link' && typeof href === 'string' && href.startsWith('/')) {
          links.push({ href, label: node.text || href });
        }
      });
    }
    node.content?.forEach(visit);
  }

  visit(content);
  return links.filter((link, index, all) => all.findIndex((item) => item.href === link.href && item.label === link.label) === index);
}

function pageToMarkdown(page: PublicSitePageContent): string {
  const links = page.internalLinks.map((link) => `- [${link.label}](${link.href})`).join('\n');
  return [`# ${page.title}`, page.description, page.bodyText, links ? `## Internal links\n${links}` : ''].filter(Boolean).join('\n\n');
}

function renderPlainNodes(nodes: JSONContent[]): string {
  return nodes.map(renderPlainNode).filter(Boolean).join('\n\n');
}

function renderPlainNode(node: JSONContent): string {
  switch (node.type) {
    case 'text':
      return node.text ?? '';
    case 'paragraph':
    case 'heading':
      return renderPlainInline(node.content ?? []);
    case 'bulletList':
    case 'orderedList':
      return (node.content ?? []).map(renderPlainNode).filter(Boolean).join('\n');
    case 'listItem':
      return `- ${renderPlainInline(node.content ?? [])}`;
    case 'blockquote':
      return renderPlainNodes(node.content ?? []);
    default:
      return renderPlainInline(node.content ?? []);
  }
}

function renderPlainInline(nodes: JSONContent[]): string {
  return nodes.map((node) => node.type === 'text' ? node.text ?? '' : renderPlainNode(node)).join('').trim();
}

function renderMarkdownNodes(nodes: JSONContent[]): string {
  return nodes.map(renderMarkdownNode).filter(Boolean).join('\n\n');
}

function renderMarkdownNode(node: JSONContent): string {
  switch (node.type) {
    case 'text':
      return renderMarkdownText(node);
    case 'paragraph':
      return renderMarkdownInline(node.content ?? []);
    case 'heading': {
      const level = Number(node.attrs?.level || 2);
      return `${'#'.repeat(Math.max(1, Math.min(level, 6)))} ${renderMarkdownInline(node.content ?? [])}`;
    }
    case 'bulletList':
      return (node.content ?? []).map((item) => `- ${renderMarkdownInline(item.content ?? [])}`).join('\n');
    case 'orderedList':
      return (node.content ?? []).map((item, index) => `${index + 1}. ${renderMarkdownInline(item.content ?? [])}`).join('\n');
    case 'listItem':
      return renderMarkdownInline(node.content ?? []);
    case 'blockquote':
      return renderMarkdownNodes(node.content ?? []).split('\n').map((line) => `> ${line}`).join('\n');
    case 'horizontalRule':
      return '---';
    default:
      return renderMarkdownInline(node.content ?? []);
  }
}

function renderMarkdownInline(nodes: JSONContent[]): string {
  return nodes.map((node) => {
    if (node.type === 'paragraph') return renderMarkdownInline(node.content ?? []);
    return renderMarkdownNode(node);
  }).join('').trim();
}

function renderMarkdownText(node: JSONContent): string {
  let value = node.text ?? '';
  node.marks?.forEach((mark) => {
    if (mark.type === 'bold') value = `**${value}**`;
    if (mark.type === 'italic') value = `_${value}_`;
    if (mark.type === 'link' && typeof mark.attrs?.href === 'string') value = `[${value}](${mark.attrs.href})`;
  });
  return value;
}
