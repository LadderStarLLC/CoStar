import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { JSONContent } from '@tiptap/react';
import NavHeader from '@/components/NavHeader';
import { BlogPostPageClient } from '@/components/blog/BlogPostPageClient';
import type { BlogPost } from '@/lib/blog';
import { getStaticBlogPostBySlug, safeParseBlogContent } from '@/lib/blog';

const siteUrl = 'https://www.ladderstar.com';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getStaticBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Blog Post - LadderStar',
      description: 'Read LadderStar job search, profile, and interview practice guidance.',
    };
  }

  const canonicalPath = post.canonicalPath ?? `/blog/${post.slug}`;

  return {
    title: post.metaTitle ?? `${post.title} - LadderStar`,
    description: post.metaDescription ?? post.excerpt,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt,
      type: 'article',
      url: `${siteUrl}${canonicalPath}`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      authors: [post.authorName],
      tags: post.tags,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const staticPost = getStaticBlogPostBySlug(params.slug);

  if (!staticPost) {
    return <BlogPostPageClient slug={params.slug} />;
  }

  return <StaticBlogPost post={staticPost} />;
}

function StaticBlogPost({ post }: { post: BlogPost }) {
  const canonicalPath = post.canonicalPath ?? `/blog/${post.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription ?? post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'LadderStar',
      url: siteUrl,
    },
    mainEntityOfPage: `${siteUrl}${canonicalPath}`,
    url: `${siteUrl}${canonicalPath}`,
    keywords: post.tags?.join(', '),
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <article>
          <div className="mb-8 border-b border-white/10 pb-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {post.tags?.map((tag) => (
                <span key={tag} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                  {tag}
                </span>
              ))}
              <span className="text-sm text-slate-500">{formatDate(post.publishedAt ?? post.updatedAt)}</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">{post.title}</h1>
            {post.excerpt && <p className="mt-4 text-lg text-slate-400">{post.excerpt}</p>}
          </div>
          <div className="prose prose-invert prose-slate max-w-none text-slate-200 prose-headings:text-white prose-a:text-amber-300 prose-strong:text-white">
            <TipTapContent content={safeParseBlogContent(post.contentJson)} />
          </div>
        </article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </main>
    </div>
  );
}

function TipTapContent({ content }: { content: JSONContent }) {
  return <>{content.content?.map((node, index) => renderNode(node, index))}</>;
}

function renderNode(node: JSONContent, index: number): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p key={index}>{renderInlineContent(node.content)}</p>;
    case 'heading': {
      const level = node.attrs?.level;
      if (level === 3) return <h3 key={index}>{renderInlineContent(node.content)}</h3>;
      return <h2 key={index}>{renderInlineContent(node.content)}</h2>;
    }
    case 'bulletList':
      return <ul key={index}>{node.content?.map((child, childIndex) => renderListItem(child, childIndex))}</ul>;
    case 'orderedList':
      return <ol key={index}>{node.content?.map((child, childIndex) => renderListItem(child, childIndex))}</ol>;
    case 'blockquote':
      return <blockquote key={index}>{node.content?.map((child, childIndex) => renderNode(child, childIndex))}</blockquote>;
    case 'horizontalRule':
      return <hr key={index} />;
    default:
      return null;
  }
}

function renderListItem(node: JSONContent, index: number): ReactNode {
  return <li key={index}>{node.content?.map((child, childIndex) => renderListChild(child, childIndex))}</li>;
}

function renderListChild(node: JSONContent, index: number): ReactNode {
  if (node.type === 'paragraph') return <span key={index}>{renderInlineContent(node.content)}</span>;
  return renderNode(node, index);
}

function renderInlineContent(content?: JSONContent[]): ReactNode {
  return content?.map((node, index) => {
    if (node.type !== 'text') return null;
    let child: ReactNode = node.text ?? '';
    node.marks?.forEach((mark) => {
      if (mark.type === 'bold') child = <strong key={`${index}-bold`}>{child}</strong>;
      if (mark.type === 'italic') child = <em key={`${index}-italic`}>{child}</em>;
      if (mark.type === 'link' && typeof mark.attrs?.href === 'string') {
        child = <Link key={`${index}-link`} href={mark.attrs.href}>{child}</Link>;
      }
    });
    return <span key={index}>{child}</span>;
  });
}

function formatDate(value: string | null): string {
  if (!value) return 'Not published';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
