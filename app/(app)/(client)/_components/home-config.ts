import type { MouseEvent } from "react";

export const monoTextClass =
  "font-otis-mono text-[0.875rem] font-medium uppercase leading-[1.125]";
export const bodyTextClass =
  "font-otis-body text-[1.25rem] font-semibold leading-[1.125]";
export const displayTextClass = "font-otis-display uppercase italic leading-[0.95]";

export const transitionOverlayColors = [
  "var(--otis-fg)",
  "var(--otis-accent1)",
  "var(--otis-accent2)",
  "var(--otis-accent3)",
  "var(--otis-accent4)",
];

export type MenuLink = {
  label: string;
  target: string;
  active?: boolean;
};

export const menuLinks: MenuLink[] = [
  { label: "Index", target: "top", active: true },
  { label: "The Good Stuff", target: "featured-work" },
  { label: "Meet Otis", target: "services" },
  { label: "Slide In", target: "contact" },
];

export type FeaturedTitle = {
  title: string;
  image?: string;
};

export const featuredTitles: FeaturedTitle[] = [
  { title: "Work Playground" },
  { title: "Cosmic Deli", image: "/images/work-items/work-item-1.jpg" },
  { title: "Skull Pop 7", image: "/images/work-items/work-item-2.jpg" },
  { title: "Red Dot Mission", image: "/images/work-items/work-item-3.jpg" },
  { title: "Sweetbones", image: "/images/work-items/work-item-4.jpg" },
];

export type ServiceCard = {
  id: string;
  title: string;
  image: string;
  background: string;
  invertText?: boolean;
};

export const serviceCards: ServiceCard[] = [
  {
    id: "service-card-1",
    title: "Visual DNA",
    image: "/images/services/service-1.jpg",
    background: "var(--otis-accent1)",
  },
  {
    id: "service-card-2",
    title: "Brand Alchemy",
    image: "/images/services/service-2.jpg",
    background: "var(--otis-accent2)",
  },
  {
    id: "service-card-3",
    title: "Feel First Design",
    image: "/images/services/service-3.jpg",
    background: "var(--otis-accent3)",
  },
  {
    id: "service-card-4",
    title: "Human Clicks",
    image: "/images/services/service-4.jpg",
    background: "var(--otis-fg)",
    invertText: true,
  },
];

export const heroImagePaths = Array.from(
  { length: 10 },
  (_, index) => `/images/work-items/work-item-${index + 1}.jpg`,
);

export type FooterItem = {
  label: string;
  target?: string;
  href?: string;
};

export type FooterColumn = {
  title: string;
  items: FooterItem[];
};

export const footerColumns: FooterColumn[] = [
  {
    title: "Quick Jumps",
    items: [
      { label: "Portfolio", target: "featured-work" },
      { label: "About", target: "services" },
      { label: "Contact", target: "contact" },
    ],
  },
  {
    title: "Side Streets",
    items: [
      { label: "Roll the Showreel" },
      { label: "Weird Shop" },
      { label: "Buy Me a Coffee" },
    ],
  },
  {
    title: "Social Signals",
    items: [
      { label: "YouTube", href: "https://www.youtube.com/@admin12121" },
      { label: "Membership", href: "https://admin12121.com/" },
      {
        label: "Instagram",
        href: "https://www.instagram.com/Admin12121web/",
      },
    ],
  },
  {
    title: "Alt Dimensions",
    items: [{ label: "Logo Dump" }, { label: "Freelance Top 100" }],
  },
];

export const featuredCardPositionsSmall = [
  { y: 100, x: 1000 },
  { y: 1500, x: 100 },
  { y: 1250, x: 1950 },
  { y: 1500, x: 850 },
  { y: 200, x: 2100 },
  { y: 250, x: 600 },
  { y: 1100, x: 1650 },
  { y: 1000, x: 800 },
  { y: 900, x: 2200 },
  { y: 150, x: 1600 },
];

export const featuredCardPositionsLarge = [
  { y: 800, x: 5000 },
  { y: 2000, x: 3000 },
  { y: 240, x: 4450 },
  { y: 1200, x: 3450 },
  { y: 500, x: 2200 },
  { y: 750, x: 1100 },
  { y: 1850, x: 3350 },
  { y: 2200, x: 1300 },
  { y: 3000, x: 1950 },
  { y: 500, x: 4500 },
];

export type ExplosionConfig = {
  gravity: number;
  friction: number;
  horizontalForce: number;
  verticalForce: number;
  rotationSpeed: number;
};

export type ExplosionParticle = {
  element: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  update: () => void;
};

export function createExplosionParticle(
  element: HTMLImageElement,
  config: ExplosionConfig,
): ExplosionParticle {
  const particle: ExplosionParticle = {
    element,
    x: 0,
    y: 0,
    vx: (Math.random() - 0.5) * config.horizontalForce,
    vy: -config.verticalForce - Math.random() * 10,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * config.rotationSpeed,
    update: () => {
      particle.vy += config.gravity;
      particle.vx *= config.friction;
      particle.vy *= config.friction;
      particle.rotationSpeed *= config.friction;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;
      particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px) rotate(${particle.rotation}deg)`;
    },
  };

  return particle;
}

export type InternalLinkHandler = (
  event: MouseEvent<HTMLAnchorElement>,
  target: string,
) => void;
