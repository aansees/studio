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
      { label: "Our Process", href: "#process" },
      { label: "Start a Project", href: "/start-project" },
      { label: "Services", href: "/services" },
      { label: "Project Work", href: "/case-study" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Websites", href: "/start-project" },
      { label: "Web Apps", href: "/start-project" },
      { label: "Custom Software", href: "/start-project" },
      { label: "Mobile Apps", href: "/start-project" },
      { label: "Automation", href: "/start-project" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Planning Guide", href: "#" },
      { label: "Support", href: "/settings" },
      { label: "Contact", href: "/contact" },
      { label: "Client Login", href: "/login" },
    ],
  },
];

export const footerLegalLinks: FooterLinkItem[] = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Legal", href: "#" },
];
