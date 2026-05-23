export interface FooterLinkItem {
  label: string;
  href: string;
}

export interface FooterLinkColumn {
  title: string;
  links: FooterLinkItem[];
}

export const footerNavColumns: FooterLinkColumn[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Our Team", href: "/team" },
      { label: "Career", href: "#" },
      { label: "Services", href: "/services" },
      { label: "Case Studies", href: "/case-study" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Features & Capabilities", href: "#" },
      { label: "Process & Workflow", href: "#" },
      { label: "Security & Compliance", href: "#" },
      { label: "Integrations", href: "/integration" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Tutorial", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Support", href: "#" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export const footerLegalLinks: FooterLinkItem[] = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Legal", href: "#" },
];
