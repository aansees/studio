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
