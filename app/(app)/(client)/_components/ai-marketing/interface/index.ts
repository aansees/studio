export interface MobileMenuSubItem {
  id: string;
  label: string;
  href: string;
}

export interface MobileMenuData {
  id: string;
  title: string;
  submenu: MobileMenuSubItem[];
}

export interface CaseStudyStat {
  value: number;
  suffix: string;
  label: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  image: string;
  excerpt: string;
  stats?: CaseStudyStat[];
  client?: string;
  date?: string;
}

/** Blog post as used in lists and cards (from markdown frontmatter + slug). */
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  excerpt: string;
  /** Optional: from markdown frontmatter */
  description?: string;
  /** Optional: alternate date field (e.g. publishDate) for sorting/display */
  publishDate?: string;
  /** Optional: reading time from frontmatter */
  readTime?: string;
  /** Optional: author name */
  author?: string;
  /** Optional: author avatar URL */
  authorImage?: string;
  /** Optional: related post slugs for details page */
  related?: string[];
  /** Optional: raw markdown body (when loaded via getMarkDownData) */
  content?: string;
  [key: string]: unknown;
}
