"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const monoTextClass =
  "font-otis-mono text-[0.875rem] font-medium uppercase leading-[1.125]";
const bodyTextClass =
  "font-otis-body text-[1.25rem] font-semibold leading-[1.125]";
const displayTextClass = "font-otis-display uppercase italic leading-[0.95]";

const menuLinks = [
  { label: "Index", target: "top", active: true },
  { label: "The Good Stuff", target: "featured-work" },
  { label: "Meet Otis", target: "services" },
  { label: "Slide In", target: "contact" },
];

const featuredTitles = [
  { title: "Work Playground" },
  { title: "Cosmic Deli", image: "/images/work-items/work-item-1.jpg" },
  { title: "Skull Pop 7", image: "/images/work-items/work-item-2.jpg" },
  { title: "Red Dot Mission", image: "/images/work-items/work-item-3.jpg" },
  { title: "Sweetbones", image: "/images/work-items/work-item-4.jpg" },
];

const serviceCards = [
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

const heroImagePaths = Array.from(
  { length: 10 },
  (_, index) => `/images/work-items/work-item-${index + 1}.jpg`,
);

const footerColumns = [
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

const featuredCardPositionsSmall = [
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

const featuredCardPositionsLarge = [
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

type ExplosionConfig = {
  gravity: number;
  friction: number;
  horizontalForce: number;
  verticalForce: number;
  rotationSpeed: number;
};

type ExplosionParticle = {
  element: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  update: () => void;
};

function createExplosionParticle(
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

export default function Page() {
  const rootRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLImageElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const explosionContainerRef = useRef<HTMLDivElement>(null);
  const isMenuAnimatingRef = useRef(false);
  const scrollYRef = useRef(0);
  const bodyStylesRef = useRef<{
    backgroundColor: string;
    color: string;
    position: string;
    top: string;
    width: string;
  } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const { style } = document.body;
    bodyStylesRef.current = {
      backgroundColor: style.backgroundColor,
      color: style.color,
      position: style.position,
      top: style.top,
      width: style.width,
    };

    style.backgroundColor = "#edf1e8";
    style.color = "#141414";

    return () => {
      const initialStyles = bodyStylesRef.current;

      if (!initialStyles) {
        return;
      }

      style.backgroundColor = initialStyles.backgroundColor;
      style.color = initialStyles.color;
      style.position = initialStyles.position;
      style.top = initialStyles.top;
      style.width = initialStyles.width;
    };
  }, []);

  useEffect(() => {
    const heroImage = heroImageRef.current;

    if (!heroImage) {
      return;
    }

    let currentImageIndex = 1;
    const intervalId = window.setInterval(() => {
      currentImageIndex =
        currentImageIndex >= heroImagePaths.length ? 1 : currentImageIndex + 1;
      heroImage.src = heroImagePaths[currentImageIndex - 1];
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const footer = footerRef.current;
    const explosionContainer = explosionContainerRef.current;

    if (!footer || !explosionContainer) {
      return;
    }

    const config = {
      gravity: 0.25,
      friction: 0.99,
      horizontalForce: 20,
      verticalForce: 15,
      rotationSpeed: 10,
    };

    const imagePaths = Array.from(
      { length: 10 },
      (_, index) => `/images/work-items/work-item-${index + 1}.jpg`,
    );

    imagePaths.forEach((path) => {
      const image = new Image();
      image.src = path;
    });

    const createParticles = () => {
      explosionContainer.innerHTML = "";

      imagePaths.forEach((path) => {
        const particle = document.createElement("img");
        particle.src = path;
        particle.className =
          "absolute bottom-[-200px] left-1/2 h-auto w-[150px] -translate-x-1/2 rounded-[1rem] object-cover will-change-transform";
        explosionContainer.appendChild(particle);
      });
    };

    let hasExploded = false;
    let animationFrameId = 0;
    let checkTimeout = 0;

    const explode = () => {
      if (hasExploded) {
        return;
      }

      hasExploded = true;
      createParticles();

      const particleElements = Array.from(
        explosionContainer.querySelectorAll<HTMLImageElement>("img"),
      );
      const particles = particleElements.map((element) =>
        createExplosionParticle(element, config),
      );

      const animate = () => {
        particles.forEach((particle) => particle.update());
        animationFrameId = window.requestAnimationFrame(animate);

        if (
          particles.every(
            (particle) => particle.y > explosionContainer.offsetHeight / 2,
          )
        ) {
          window.cancelAnimationFrame(animationFrameId);
        }
      };

      animate();
    };

    const checkFooterPosition = () => {
      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (footerRect.top > viewportHeight + 100) {
        hasExploded = false;
      }

      if (!hasExploded && footerRect.top <= viewportHeight + 250) {
        explode();
      }
    };

    const handleScroll = () => {
      window.clearTimeout(checkTimeout);
      checkTimeout = window.setTimeout(checkFooterPosition, 5);
    };

    const handleResize = () => {
      hasExploded = false;
    };

    createParticles();
    const initialTimeoutId = window.setTimeout(checkFooterPosition, 500);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearTimeout(checkTimeout);
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;

      if (!root) {
        return;
      }

      const transitionOverlays = gsap.utils.toArray<HTMLElement>(
        "[data-transition-overlay]",
      );
      const navItems = gsap.utils.toArray<HTMLElement>("[data-nav-item]");
      const navFooterHeaders = gsap.utils.toArray<HTMLElement>(
        "[data-nav-footer-header]",
      );
      const navFooterCopies = gsap.utils.toArray<HTMLElement>(
        "[data-nav-footer-copy]",
      );
      const heroFrame = root.querySelector<HTMLElement>("[data-hero-frame]");
      const heroHolder = root.querySelector<HTMLElement>("[data-hero-holder]");
      const media = gsap.matchMedia();

      gsap.set(transitionOverlays, {
        scaleY: 1,
        transformOrigin: "top",
      });
      gsap.to(transitionOverlays, {
        scaleY: 0,
        duration: 0.6,
        stagger: -0.1,
        ease: "power2.inOut",
      });

      gsap.set([...navItems, ...navFooterHeaders, ...navFooterCopies], {
        opacity: 0,
        y: "100%",
      });

      if (heroFrame && heroHolder) {
        gsap.set(heroFrame, {
          yPercent: -110,
          scale: 0.25,
          rotation: -15,
        });

        ScrollTrigger.create({
          trigger: heroHolder,
          start: "top bottom",
          end: "top top",
          onUpdate: (self) => {
            const progress = self.progress;

            gsap.set(heroFrame, {
              yPercent: -110 + 110 * progress,
              scale: 0.25 + 0.75 * progress,
              rotation: -15 + 15 * progress,
            });
          },
        });
      }

      media.add("(min-width: 1001px)", () => {
        const featuredSection = root.querySelector<HTMLElement>(
          "[data-featured-section]",
        );
        const featuredTitlesTrack = root.querySelector<HTMLElement>(
          "[data-featured-titles]",
        );
        const featuredCards = gsap.utils.toArray<HTMLElement>(
          "[data-featured-image-card]",
        );
        const indicators = gsap.utils.toArray<HTMLElement>(
          "[data-featured-indicator]",
        );
        const services = gsap.utils.toArray<HTMLElement>("[data-service-card]");
        const contactCta = root.querySelector<HTMLElement>("[data-contact-cta]");
        const cleanupTweens: Array<gsap.core.Tween | ScrollTrigger> = [];

        if (featuredSection && featuredTitlesTrack && featuredCards.length > 0) {
          const positions =
            window.innerWidth >= 1600
              ? featuredCardPositionsLarge
              : featuredCardPositionsSmall;

          featuredCards.forEach((card, index) => {
            const position = positions[index];
            gsap.set(card, {
              x: position.x,
              y: position.y,
              z: -1500,
              scale: 0,
            });
          });

          const featuredTrigger = ScrollTrigger.create({
            trigger: featuredSection,
            start: "top top",
            end: () => `+=${window.innerHeight * 5}px`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const moveDistance = window.innerWidth * 4;
              gsap.set(featuredTitlesTrack, {
                x: -moveDistance * self.progress,
              });

              featuredCards.forEach((card, index) => {
                const staggerOffset = index * 0.075;
                const scaledProgress = (self.progress - staggerOffset) * 2;
                const individualProgress = Math.max(0, Math.min(1, scaledProgress));
                const newZ = -1500 + 3000 * individualProgress;
                const scale = Math.max(0, Math.min(1, individualProgress * 10));

                gsap.set(card, {
                  z: newZ,
                  scale,
                });
              });

              const progressPerIndicator = 1 / indicators.length;

              indicators.forEach((indicator, index) => {
                const indicatorStart = index * progressPerIndicator;
                gsap.to(indicator, {
                  opacity: self.progress > indicatorStart ? 1 : 0.2,
                  duration: 0.3,
                  overwrite: "auto",
                });
              });
            },
          });

          cleanupTweens.push(featuredTrigger);
        }

        if (services.length > 0 && contactCta) {
          const mainTrigger = ScrollTrigger.create({
            trigger: services[0],
            start: "top 50%",
            endTrigger: services[services.length - 1],
            end: "top 150%",
          });

          cleanupTweens.push(mainTrigger);

          services.forEach((service, index) => {
            const isLastServiceCard = index === services.length - 1;
            const serviceCardInner =
              service.querySelector<HTMLElement>("[data-service-card-inner]");

            if (!serviceCardInner || isLastServiceCard) {
              return;
            }

            const pinTrigger = ScrollTrigger.create({
              trigger: service,
              start: "top 45%",
              endTrigger: contactCta,
              end: "top 90%",
              pin: true,
              pinSpacing: false,
            });

            cleanupTweens.push(pinTrigger);

            const scrollTween = gsap.to(serviceCardInner, {
              y: `-${(services.length - index) * 14}vh`,
              ease: "none",
              scrollTrigger: {
                trigger: service,
                start: "top 45%",
                endTrigger: contactCta,
                end: "top 90%",
                scrub: true,
              },
            });

            cleanupTweens.push(scrollTween);
          });
        }

        return () => {
          cleanupTweens.forEach((item) => {
            item.kill();
          });
        };
      });

      ScrollTrigger.refresh();

      return () => {
        media.revert();
      };
    },
    { scope: rootRef },
  );

  const setBodyLockState = (shouldLock: boolean) => {
    const initialStyles = bodyStylesRef.current;

    if (!initialStyles) {
      return;
    }

    document.body.style.position = shouldLock ? "fixed" : initialStyles.position;
    document.body.style.top = shouldLock
      ? `-${scrollYRef.current}px`
      : initialStyles.top;
    document.body.style.width = shouldLock ? "100%" : initialStyles.width;
  };

  const toggleMenu = (forceOpen?: boolean) => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const navOverlay = root.querySelector<HTMLElement>("[data-nav-overlay]");
    const openLabel = root.querySelector<HTMLElement>("[data-open-label]");
    const closeLabel = root.querySelector<HTMLElement>("[data-close-label]");
    const navItems = gsap.utils.toArray<HTMLElement>("[data-nav-item]");
    const navFooterHeaders = gsap.utils.toArray<HTMLElement>(
      "[data-nav-footer-header]",
    );
    const navFooterCopies = gsap.utils.toArray<HTMLElement>(
      "[data-nav-footer-copy]",
    );

    if (!navOverlay || !openLabel || !closeLabel) {
      return;
    }

    const nextState = forceOpen ?? !isMenuOpen;
    const tweenTargets = [
      navOverlay,
      openLabel,
      closeLabel,
      ...navItems,
      ...navFooterHeaders,
      ...navFooterCopies,
    ];

    if (isMenuAnimatingRef.current) {
      gsap.killTweensOf(tweenTargets);
      isMenuAnimatingRef.current = false;
    }

    if (nextState) {
      isMenuAnimatingRef.current = true;
      scrollYRef.current = window.scrollY;
      setBodyLockState(true);
      setIsMenuOpen(true);

      gsap.to(openLabel, {
        y: "-1rem",
        duration: 0.3,
      });
      gsap.to(closeLabel, {
        y: "-1rem",
        duration: 0.3,
      });
      gsap.to(navOverlay, {
        opacity: 1,
        duration: 0.3,
        onComplete: () => {
          isMenuAnimatingRef.current = false;
        },
      });
      gsap.to([...navItems, ...navFooterHeaders, ...navFooterCopies], {
        opacity: 1,
        y: "0%",
        duration: 0.75,
        stagger: 0.075,
        ease: "power4.out",
      });

      return;
    }

    isMenuAnimatingRef.current = true;
    setBodyLockState(false);
    window.scrollTo(0, scrollYRef.current);
    setIsMenuOpen(false);

    gsap.to(openLabel, {
      y: "0rem",
      duration: 0.3,
    });
    gsap.to(closeLabel, {
      y: "0rem",
      duration: 0.3,
    });
    gsap.to(navOverlay, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        gsap.set([...navItems, ...navFooterHeaders, ...navFooterCopies], {
          opacity: 0,
          y: "100%",
        });
        isMenuAnimatingRef.current = false;
      },
    });
  };

  const handleInternalLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    target: string,
  ) => {
    event.preventDefault();

    const scrollToTarget = () => {
      if (target === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      document.getElementById(target)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    if (isMenuOpen) {
      toggleMenu(false);
      window.setTimeout(scrollToTarget, 360);
      return;
    }

    scrollToTarget();
  };

  return (
    <main
      ref={rootRef}
      className="relative min-h-screen overflow-x-hidden bg-[var(--otis-bg)] text-[var(--otis-fg)] [--otis-accent1:#ed6a5a] [--otis-accent2:#f4f1bb] [--otis-accent3:#9bc1bc] [--otis-accent4:#5d576b] [--otis-bg:#edf1e8] [--otis-bg2:#d7dbd2] [--otis-fg:#141414]"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100000]">
        {[
          "var(--otis-fg)",
          "var(--otis-accent1)",
          "var(--otis-accent2)",
          "var(--otis-accent3)",
          "var(--otis-accent4)",
        ].map((background, index) => (
          <div
            key={background}
            data-transition-overlay
            className="absolute inset-0 origin-top"
            style={{
              background,
              zIndex: 5 - index,
            }}
          />
        ))}
      </div>

      <div className="relative w-screen overflow-x-hidden">
        <nav className="fixed left-0 top-0 z-[100] flex w-screen items-center justify-between p-[2em]">
          <div className="rounded-[0.4em] bg-[var(--otis-fg)] px-[0.65em] py-[0.5em]">
            <a
              href="#top"
              onClick={(event) => handleInternalLinkClick(event, "top")}
              className={`${monoTextClass} text-[var(--otis-bg)]`}
            >
              Otis ✦ Valen
            </a>
          </div>

          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="home-menu"
            onClick={() => toggleMenu()}
            className={`cursor-pointer rounded-[0.4em] px-[0.65em] pb-[0.65em] pt-[0.6em] ${
              isMenuOpen
                ? "bg-[var(--otis-fg)] text-[var(--otis-bg)]"
                : "bg-[var(--otis-bg2)] text-[var(--otis-fg)]"
            }`}
          >
            <span className="relative flex h-[0.875rem] flex-col items-center overflow-hidden [clip-path:polygon(0_0,100%_0,100%_100%,0%_100%)]">
              <span data-open-label className={monoTextClass}>
                Menu
              </span>
              <span data-close-label className={monoTextClass}>
                Close
              </span>
            </span>
          </button>
        </nav>

        <div
          id="home-menu"
          data-nav-overlay
          aria-hidden={!isMenuOpen}
          className={`fixed inset-0 z-[90] h-[100svh] w-screen overflow-hidden bg-[var(--otis-bg2)] opacity-0 ${
            isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <div className="absolute left-1/2 top-[47.5%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[1em]">
            {menuLinks.map((link) => (
              <div
                key={link.label}
                data-nav-item
                className={`rounded-[0.5em] ${
                  link.active ? "bg-[var(--otis-fg)]" : "bg-[var(--otis-bg)]"
                }`}
              >
                <a
                  href={`#${link.target}`}
                  onClick={(event) => handleInternalLinkClick(event, link.target)}
                  className={`${bodyTextClass} block px-[0.5em] pb-[0.3em] pt-[0.5em] ${
                    link.active ? "text-[var(--otis-bg)]" : "text-[var(--otis-fg)]"
                  } max-[1000px]:text-[1.5rem]`}
                >
                  {link.label}
                </a>
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 flex w-full items-end justify-between gap-[1.5em] p-[2em] text-center max-[1000px]:flex-col max-[1000px]:items-center max-[1000px]:justify-center">
            <div className="flex flex-col gap-[0.5em]">
              <div data-nav-footer-header className="flex justify-start gap-[0.75em] max-[1000px]:justify-center">
                <p
                  className={`${monoTextClass} rounded-[0.4em] bg-[var(--otis-bg)] px-[0.65em] py-[0.5em] text-[var(--otis-fg)]`}
                >
                  Find Me
                </p>
              </div>
              <div data-nav-footer-copy className="flex justify-center gap-[0.75em]">
                <a
                  href="https://www.instagram.com/Admin12121web/"
                  target="_blank"
                  rel="noreferrer"
                  className={`${monoTextClass} text-[0.75rem]`}
                >
                  Instagram
                </a>
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className={`${monoTextClass} text-[0.75rem]`}
                >
                  LinkedIn
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-[0.5em] max-[1000px]:hidden">
              <div data-nav-footer-copy className="flex justify-center gap-[0.75em]">
                <p className={`${monoTextClass} text-[0.75rem]`}>
                  MWT — May 2025 // Admin12121
                </p>
              </div>
            </div>

            <div className="mt-[1em] flex flex-col gap-[0.5em]">
              <div data-nav-footer-header className="flex justify-end gap-[0.75em] max-[1000px]:justify-center">
                <p
                  className={`${monoTextClass} rounded-[0.4em] bg-[var(--otis-bg)] px-[0.65em] py-[0.5em] text-[var(--otis-fg)]`}
                >
                  Say Hi
                </p>
              </div>
              <div data-nav-footer-copy className="flex justify-center gap-[0.75em]">
                <a
                  href="mailto:hello@otisvalen.com"
                  className={`${monoTextClass} text-[0.75rem]`}
                >
                  hello@otisvalen.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <section
          id="top"
          className="relative flex h-[100svh] w-screen flex-col items-center justify-center overflow-x-hidden p-[2em]"
        >
          <div className="relative">
            <div className="relative -translate-x-[20%]">
              <h1 className={`${displayTextClass} text-[20vw] leading-[0.9]`}>
                Otis
              </h1>
            </div>
            <div className="relative z-[2] translate-x-[20%]">
              <h1 className={`${displayTextClass} text-[20vw] leading-[0.9]`}>
                Studio
              </h1>
            </div>
          </div>

          <div className="absolute bottom-0 flex w-full justify-between p-[2em] max-[1000px]:justify-end">
            <div className="h-[1rem] max-[1000px]:hidden">
              <img
                src="/images/global/symbols.png"
                alt=""
                className="h-full w-auto object-contain"
              />
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 max-[1000px]:left-[2em] max-[1000px]:translate-x-0">
              <p className={monoTextClass}>Pixels by Otis / 2025</p>
            </div>

            <div>
              <p className={monoTextClass}>Portfolio Mode: ON</p>
            </div>
          </div>
        </section>

        <section
          data-hero-holder
          className="relative h-[100svh] w-screen p-[2em]"
        >
          <div
            data-hero-frame
            className="relative h-full w-full overflow-hidden rounded-[2em] border-[0.3em] border-[var(--otis-fg)]"
          >
            <img
              ref={heroImageRef}
              src="/images/hero/img1.jpg"
              alt="Featured project montage"
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section
          id="featured-work"
          data-featured-section
          className="relative h-[100svh] w-screen overflow-hidden max-[1000px]:h-auto max-[1000px]:py-[4em]"
        >
          <div className="absolute left-1/2 top-1/2 hidden h-[200vh] w-[200vw] -translate-x-1/2 -translate-y-1/2 [perspective:500px] [transform-style:preserve-3d] min-[1001px]:block">
            {heroImagePaths.map((path, index) => (
              <div
                key={path}
                data-featured-image-card
                className="absolute h-[300px] w-[300px] overflow-hidden rounded-[2em]"
              >
                <img
                  src={path}
                  alt={`Featured work image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          <div
            data-featured-titles
            className="relative flex h-screen w-[500vw] will-change-transform max-[1000px]:h-auto max-[1000px]:w-screen max-[1000px]:flex-col max-[1000px]:gap-[2em]"
          >
            {featuredTitles.map((item, index) => (
              <div
                key={item.title}
                className={`flex flex-1 flex-col items-center justify-center max-[1000px]:gap-[1em] ${
                  index === 0 ? "max-[1000px]:mb-[2em]" : ""
                }`}
              >
                {item.image ? (
                  <div className="relative top-0 hidden h-[150px] w-[calc(100%-4em)] overflow-hidden rounded-[1em] border-[0.2em] border-[var(--otis-fg)] max-[1000px]:block">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}

                <h1
                  className={`${displayTextClass} translate-y-[-0.5em] text-center text-[clamp(3rem,7vw,6rem)] max-[1000px]:w-[75%] max-[1000px]:translate-y-0`}
                >
                  {item.title}
                </h1>
              </div>
            ))}
          </div>

          <div className="absolute right-[2em] top-1/2 z-10 hidden w-[2rem] -translate-y-1/2 flex-col items-center justify-center gap-[0.35rem] rounded-[40px] bg-[var(--otis-fg)] px-[0.65rem] py-[1.25rem] text-[var(--otis-bg)] min-[1001px]:flex">
            {Array.from({ length: 5 }, (_, sectionIndex) => (
              <div
                key={`indicator-section-${sectionIndex + 1}`}
                className="flex w-full flex-col items-center gap-[0.35rem]"
              >
                <p className={monoTextClass}>{`0${sectionIndex + 1}`}</p>
                {Array.from({ length: 10 }, (_, indicatorIndex) => (
                  <div
                    key={`indicator-${sectionIndex + 1}-${indicatorIndex + 1}`}
                    data-featured-indicator
                    className="h-[1.5px] w-full bg-[var(--otis-bg)] opacity-20"
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 z-[2] flex w-full items-center justify-between p-[2em] max-[1000px]:relative max-[1000px]:mt-[4em] max-[1000px]:justify-center">
            <p className={`${monoTextClass} max-[1000px]:hidden`}>Visual Vault [ 10 ]</p>
            <p className={`${monoTextClass} max-[1000px]:hidden`}>
              {"///////////////////"}
            </p>
            <a
              href="#featured-work"
              onClick={(event) => handleInternalLinkClick(event, "featured-work")}
              className={monoTextClass}
            >
              Browse Full Bizarre
            </a>
          </div>
        </section>

        <section
          id="services"
          className="relative flex h-screen w-screen items-center justify-center p-[2em] text-center max-[1000px]:h-auto"
        >
          <div className="flex flex-col items-center gap-[1em]">
            <div className="relative mb-[2em] h-[100px] w-[100px] overflow-hidden rounded-[1em] border-[0.25rem] border-[var(--otis-fg)] outline-[0.25rem] outline-[var(--otis-accent3)]">
              <img
                src="/images/services-header/portrait.jpeg"
                alt="Otis Valen portrait"
                className="h-full w-full object-cover"
              />
            </div>
            <p className={bodyTextClass}>Your ideas. My toolbox.</p>
            <div className="mb-[6em]">
              <h1 className={`${displayTextClass} text-[clamp(3rem,7vw,6rem)]`}>
                Pixel wizardry
              </h1>
              <h1 className={`${displayTextClass} text-[clamp(3rem,7vw,6rem)]`}>
                served fresh
              </h1>
            </div>
            <div>
              <h1
                className={`${displayTextClass} relative text-[clamp(3rem,7vw,6rem)] text-transparent before:absolute before:inset-0 before:text-[var(--otis-fg)] before:content-['\\2193']`}
              >
                ↓
              </h1>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-0 max-[1000px]:gap-[2em]">
          {serviceCards.map((card) => (
            <div
              key={card.id}
              data-service-card
              className="relative min-h-[300px]"
              id={card.id}
            >
              <div
                data-service-card-inner
                className={`relative mx-auto flex min-h-[500px] w-[calc(100vw-4em)] gap-[4em] rounded-[2em] p-[2em] will-change-transform max-[1000px]:min-h-0 max-[1000px]:flex-col max-[1000px]:justify-center max-[1000px]:gap-[1em] max-[1000px]:rounded-[1em] max-[1000px]:border-[0.2em] max-[1000px]:border-[var(--otis-fg)] max-[1000px]:text-center ${
                  card.invertText ? "text-[var(--otis-bg)]" : "text-[var(--otis-fg)]"
                }`}
                style={{ backgroundColor: card.background }}
              >
                <div className="flex flex-[3] flex-col gap-[2em]">
                  <h1 className={`${displayTextClass} text-[clamp(3rem,8vw,7rem)]`}>
                    {card.title}
                  </h1>
                </div>

                <div className="aspect-[4/5] flex-1 overflow-hidden rounded-[2em] max-[1000px]:aspect-[5/3] max-[1000px]:rounded-[1em] max-[1000px]:border-[0.2em] max-[1000px]:border-[var(--otis-fg)]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section
          id="contact"
          data-contact-cta
          className="relative flex h-[100svh] w-screen items-center justify-center p-[2em] max-[1000px]:h-auto max-[1000px]:px-[2em] max-[1000px]:py-[8em]"
        >
          <a
            href="mailto:hello@otisvalen.com"
            className="relative flex h-[300px] w-[60%] cursor-pointer flex-col items-center justify-center gap-[8px] overflow-hidden rounded-[20em] border-[0.75em] border-black bg-[linear-gradient(45deg,var(--otis-accent1),var(--otis-accent2),var(--otis-accent3),var(--otis-accent4))] bg-[length:400%_400%] shadow-[10px_10px_0px_5px_#000000] transition-transform duration-200 ease-out before:absolute before:left-0 before:top-0 before:h-full before:w-[200%] before:bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.125)_0px,rgba(0,0,0,0.125)_15px,transparent_15px,transparent_30px)] before:content-[''] hover:scale-[1.01] animate-otis-gradient before:animate-otis-stripes max-[1000px]:h-[250px] max-[1000px]:w-[95%] max-[1000px]:gap-[1em] max-[1000px]:rounded-[2em]"
          >
            <div className="relative z-[1] max-[1000px]:w-[75%] max-[1000px]:text-center">
              <p className={bodyTextClass}>Collabs, or cosmic brainstorms welcome</p>
            </div>
            <div className="relative z-[1]">
              <h1 className={`${displayTextClass} text-[7rem] max-[1000px]:text-[3rem]`}>
                Hit Me Up
              </h1>
            </div>
          </a>
        </section>

        <footer
          ref={footerRef}
          className="relative flex h-[85svh] w-screen flex-col items-center justify-between overflow-hidden p-[2em] text-[var(--otis-bg)] max-[1000px]:h-[100svh]"
        >
          <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2em] bg-[var(--otis-fg)] p-[2em]">
            <div className="absolute left-0 top-0 flex w-full justify-between p-[2em]">
              <img
                src="/images/global/s6.png"
                alt=""
                className="h-[1rem] w-auto object-contain"
              />
              <img
                src="/images/global/s6.png"
                alt=""
                className="h-[1rem] w-auto object-contain"
              />
            </div>

            <div className="absolute bottom-0 left-0 flex w-full justify-between p-[2em]">
              <img
                src="/images/global/s6.png"
                alt=""
                className="h-[1rem] w-auto object-contain"
              />
              <img
                src="/images/global/s6.png"
                alt=""
                className="h-[1rem] w-auto object-contain"
              />
            </div>

            <div className="relative text-center">
              <h1 className={`${displayTextClass} text-[clamp(3rem,8vw,7rem)]`}>
                Otis Valen
              </h1>
            </div>

            <div className="mb-[8em] flex gap-[2em] max-[1000px]:mb-[2em] max-[1000px]:flex-col">
              {footerColumns.map((column, columnIndex) => (
                <div
                  key={column.title}
                  className={`flex flex-1 flex-col items-center gap-[1em] ${
                    columnIndex === 1 || columnIndex === 3 ? "max-[1000px]:hidden" : ""
                  }`}
                >
                  <p className={bodyTextClass}>{column.title}</p>

                  {column.items.map((item) => {
                    if ("href" in item && item.href) {
                      return (
                        <a
                          key={`${column.title}-${item.label}`}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`${bodyTextClass} opacity-[0.35]`}
                        >
                          {item.label}
                        </a>
                      );
                    }

                    if ("target" in item && item.target) {
                      return (
                        <a
                          key={`${column.title}-${item.label}`}
                          href={`#${item.target}`}
                          onClick={(event) =>
                            handleInternalLinkClick(event, item.target)
                          }
                          className={`${bodyTextClass} opacity-[0.35]`}
                        >
                          {item.label}
                        </a>
                      );
                    }

                    return (
                      <p
                        key={`${column.title}-${item.label}`}
                        className={`${bodyTextClass} opacity-[0.35]`}
                      >
                        {item.label}
                      </p>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="relative flex w-full justify-center gap-[2em] max-[1000px]:flex-col max-[1000px]:gap-[0.5em] max-[1000px]:text-center">
              <p className={monoTextClass}>MWT - MAY 2025</p>
              <p className={`${monoTextClass} max-[1000px]:hidden`}>{"//"}</p>
              <p className={monoTextClass}>
                Built by{" "}
                <a
                  href="https://www.youtube.com/@admin12121"
                  target="_blank"
                  rel="noreferrer"
                >
                  Admin12121
                </a>
              </p>
            </div>

            <div
              ref={explosionContainerRef}
              className="pointer-events-none absolute bottom-0 left-0 h-[200%] w-full overflow-hidden max-[1000px]:hidden"
            />
          </div>
        </footer>
      </div>
    </main>
  );
}
