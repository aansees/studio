"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ContactCtaSection,
  FeaturedWorkSection,
  HeroSection,
  HomeFooter,
  HomeNav,
  ServicesHeaderSection,
  ServicesStackSection,
  TransitionOverlay,
  createExplosionParticle,
  featuredCardPositionsLarge,
  featuredCardPositionsSmall,
  heroImagePaths,
} from "./_components";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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

    heroImagePaths.forEach((path) => {
      const image = new Image();
      image.src = path;
    });

    const createParticles = () => {
      explosionContainer.innerHTML = "";

      heroImagePaths.forEach((path) => {
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

      const particles = Array.from(
        explosionContainer.querySelectorAll<HTMLImageElement>("img"),
      ).map((element) => createExplosionParticle(element, config));

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
        const breakpoints = [
          { maxWidth: 1000, movementMultiplier: 450 },
          { maxWidth: 1100, movementMultiplier: 500 },
          { maxWidth: 1200, movementMultiplier: 550 },
          { maxWidth: 1300, movementMultiplier: 600 },
        ];

        const getMovementMultiplier = () => {
          const width = window.innerWidth;

          for (const breakpoint of breakpoints) {
            if (width <= breakpoint.maxWidth) {
              return breakpoint.movementMultiplier;
            }
          }

          return 650;
        };

        const animationState = {
          yPercent: -110,
          scale: 0.25,
          rotation: -15,
          targetMouseX: 0,
          currentMouseX: 0,
          movementMultiplier: getMovementMultiplier(),
        };

        let heroAnimationFrame = 0;

        const renderHeroFrame = () => {
          const scaledMovementMultiplier =
            (1 - animationState.scale) * animationState.movementMultiplier;
          const maxHorizontalMovement =
            window.innerWidth >= 900 && animationState.scale < 0.95
              ? animationState.targetMouseX * scaledMovementMultiplier
              : 0;

          animationState.currentMouseX = gsap.utils.interpolate(
            animationState.currentMouseX,
            maxHorizontalMovement,
            0.05,
          );

          gsap.set(heroFrame, {
            x: animationState.currentMouseX,
            yPercent: animationState.yPercent,
            scale: animationState.scale,
            rotation: animationState.rotation,
          });

          heroAnimationFrame = window.requestAnimationFrame(renderHeroFrame);
        };

        const handleMouseMove = (event: globalThis.MouseEvent) => {
          animationState.targetMouseX =
            (event.clientX / window.innerWidth - 0.5) * 2;
        };

        const handleHeroResize = () => {
          animationState.movementMultiplier = getMovementMultiplier();

          if (window.innerWidth < 900) {
            animationState.targetMouseX = 0;
          }
        };

        document.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("resize", handleHeroResize);
        renderHeroFrame();

        const heroScrollTrigger = ScrollTrigger.create({
          trigger: heroHolder,
          start: "top bottom",
          end: "top top",
          onUpdate: (self) => {
            const progress = self.progress;

            animationState.yPercent = -110 + 110 * progress;
            animationState.scale = 0.25 + 0.75 * progress;
            animationState.rotation = -15 + 15 * progress;
          },
        });

        media.add("all", () => {
          return () => {
            heroScrollTrigger.kill();
            document.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("resize", handleHeroResize);
            window.cancelAnimationFrame(heroAnimationFrame);
          };
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

          cleanupTweens.push(
            ScrollTrigger.create({
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
                  const individualProgress = Math.max(
                    0,
                    Math.min(1, scaledProgress),
                  );
                  const newZ = -1500 + 3000 * individualProgress;
                  const scale = Math.max(
                    0,
                    Math.min(1, individualProgress * 10),
                  );

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
            }),
          );
        }

        if (services.length > 0 && contactCta) {
          cleanupTweens.push(
            ScrollTrigger.create({
              trigger: services[0],
              start: "top 50%",
              endTrigger: services[services.length - 1],
              end: "top 150%",
            }),
          );

          services.forEach((service, index) => {
            const isLastServiceCard = index === services.length - 1;
            const serviceCardInner =
              service.querySelector<HTMLElement>("[data-service-card-inner]");

            if (!serviceCardInner || isLastServiceCard) {
              return;
            }

            cleanupTweens.push(
              ScrollTrigger.create({
                trigger: service,
                start: "top 45%",
                endTrigger: contactCta,
                end: "top 90%",
                pin: true,
                pinSpacing: false,
              }),
            );

            cleanupTweens.push(
              gsap.to(serviceCardInner, {
                y: `-${(services.length - index) * 14}vh`,
                ease: "none",
                scrollTrigger: {
                  trigger: service,
                  start: "top 45%",
                  endTrigger: contactCta,
                  end: "top 90%",
                  scrub: true,
                },
              }),
            );
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

      gsap.to(openLabel, { y: "-1rem", duration: 0.3 });
      gsap.to(closeLabel, { y: "-1rem", duration: 0.3 });
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

    gsap.to(openLabel, { y: "0rem", duration: 0.3 });
    gsap.to(closeLabel, { y: "0rem", duration: 0.3 });
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
      <TransitionOverlay />

      <div className="relative w-screen overflow-x-hidden">
        <HomeNav
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => toggleMenu()}
          onInternalLinkClick={handleInternalLinkClick}
        />
        <HeroSection heroImageRef={heroImageRef} />
        <FeaturedWorkSection onInternalLinkClick={handleInternalLinkClick} />
        <ServicesHeaderSection />
        <ServicesStackSection />
        <ContactCtaSection />
        <HomeFooter
          footerRef={footerRef}
          explosionContainerRef={explosionContainerRef}
          onInternalLinkClick={handleInternalLinkClick}
        />
      </div>
    </main>
  );
}
