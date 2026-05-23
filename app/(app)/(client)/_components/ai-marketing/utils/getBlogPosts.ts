import type { BlogPost } from '@/app/(app)/(client)/_components/ai-marketing/interface';
import getMarkDownData from '@/app/(app)/(client)/_components/ai-marketing/utils/getMarkDownData';

/**
 * Load all blog markdown files, normalize frontmatter into BlogPost shape, and sort by date (newest first).
 * Use this for lists and related-articles so components get typed, safe fields (strings/arrays with fallbacks).
 */
export function getBlogPosts(): BlogPost[] {
  return getMarkDownData('app/(app)/(client)/_components/ai-marketing/data/blog', true, 'date').map((post) => ({
    slug: post.slug,
    title: typeof post.title === 'string' ? post.title : '',
    date: typeof post.date === 'string' ? post.date : '',
    category: typeof post.category === 'string' ? post.category : '',
    tags: Array.isArray(post.tags) ? (post.tags as string[]) : [],
    image: typeof post.image === 'string' ? post.image : '',
    excerpt: typeof post.excerpt === 'string' ? post.excerpt : '',
  }));
}
