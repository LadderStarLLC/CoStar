import type { Metadata } from 'next';
import { BlogPageClient } from '@/components/blog/BlogPageClient';

export const metadata: Metadata = {
  title: 'Blog - LadderStar',
  description: 'Interview practice, hiring signals, and LadderStar platform updates.',
};

export default function BlogPage() {
  return <BlogPageClient />;
}
