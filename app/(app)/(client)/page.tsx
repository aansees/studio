"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  AboutDescriptionSection,
  ContactCtaSection,
  FeaturedWorkSection,
  HeroSection,
  ServicesHeaderSection,
  ServicesStackSection,
  TransitionOverlay,
  featuredCardPositionsLarge,
  featuredCardPositionsSmall,
  heroImagePaths,
} from "./_components";
import {
  markHomeEntryOverlayPlayed,
  shouldPlayHomeEntryOverlay,
} from "./_components/document-entry-state";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase, SplitText);
CustomEase.create("hop", "0.85, 0, 0.15, 1");

export default function Page() {
  const [shouldRunPreloader] = useState(() => shouldPlayHomeEntryOverlay("/"));
  const rootRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLImageElement>(null);
  const isPreloaderActiveRef = useRef(shouldRunPreloader);
  const isHeroImageFrozenRef = useRef(!shouldRunPreloader);
  const scrollYRef = useRef(0);
  const bodyStylesRef = useRef<{
    backgroundColor: string;
    color: string;
    overflow: string;
    position: string;
    top: string;
    width: string;
    htmlOverflow: string;
  } | null>(null);

  function setBodyLockState(shouldLock: boolean) {
    const initialStyles = bodyStylesRef.current;

    if (!initialStyles) {
      return;
    }

    document.documentElement.style.overflow = shouldLock
      ? "hidden"
      : initialStyles.htmlOverflow;
    document.body.style.overflow = shouldLock ? "hidden" : initialStyles.overflow;
    document.body.style.position = shouldLock ? "fixed" : initialStyles.position;
    document.body.style.top = shouldLock
      ? `-${scrollYRef.current}px`
      : initialStyles.top;
    document.body.style.width = shouldLock ? "100%" : initialStyles.width;
  }

  useEffect(() => {
    if (!shouldRunPreloader) {
      return;
    }

    markHomeEntryOverlayPlayed();
  }, [shouldRunPreloader]);

  useEffect(() => {
    const { style } = document.body;
    bodyStylesRef.current = {
      backgroundColor: style.backgroundColor,
      color: style.color,
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      width: style.width,
      htmlOverflow: document.documentElement.style.overflow,
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
      style.overflow = initialStyles.overflow;
      style.position = initialStyles.position;
      style.top = initialStyles.top;
      style.width = initialStyles.width;
      document.documentElement.style.overflow = initialStyles.htmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (!shouldRunPreloader) {
      return;
    }

    const initialStyles = bodyStylesRef.current;

    if (!initialStyles) {
      return;
    }

    scrollYRef.current = 0;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    document.body.style.position = "fixed";
    document.body.style.top = "0px";
    document.body.style.width = "100%";
  }, [shouldRunPreloader]);

  useEffect(() => {
    heroImagePaths.forEach((path) => {
      const image = new Image();
      image.src = path;
    });
  }, []);

  useEffect(() => {
    const heroImage = heroImageRef.current;

    if (!heroImage) {
      return;
    }

    let currentImageIndex = 0;
    const syncHeroImages = (path: string) => {
      if (heroImageRef.current) {
        heroImageRef.current.src = path;
      }
    };

    syncHeroImages(heroImagePaths[currentImageIndex]);

    const intervalId = window.setInterval(() => {
      if (isHeroImageFrozenRef.current) {
        return;
      }

      currentImageIndex = (currentImageIndex + 1) % heroImagePaths.length;
      syncHeroImages(heroImagePaths[currentImageIndex]);
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;

      if (!root) {
        return;
      }

      const preloaderRoot = root.querySelector<HTMLElement>("[data-preloader-root]");
      const preloaderPanel = root.querySelector<HTMLElement>("[data-preloader-panel]");
      const preloaderCounter = root.querySelector<HTMLElement>(
        "[data-preloader-counter]",
      );
      const preloaderCopyTrack = root.querySelector<HTMLElement>(
        "[data-preloader-copy-track]",
      );
      const preloaderGallery = root.querySelector<HTMLElement>(
        "[data-preloader-gallery]",
      );
      const preloaderCenterSlot = root.querySelector<HTMLElement>(
        "[data-preloader-center-slot]",
      );
      const preloaderImages = gsap.utils.toArray<HTMLElement>(
        "[data-preloader-image]",
      );
      const heroTitles = gsap.utils.toArray<HTMLElement>("[data-preloader-title]");
      const heroFrame = root.querySelector<HTMLElement>("[data-hero-frame]");
      const heroHolder = root.querySelector<HTMLElement>("[data-hero-holder]");
      const media = gsap.matchMedia();
      const splitHeroTitles = heroTitles.map(
        (title) =>
          new SplitText(title, {
            type: "words",
            mask: "words",
            wordsClass: "preloader-word",
          }),
      );
      const heroTitleWords = splitHeroTitles.flatMap((title) =>
        title.words.map((word) => word as HTMLElement),
      );
      const heroTitleWordMasks = heroTitleWords
        .map((word) => word.parentElement)
        .filter((mask): mask is HTMLElement => Boolean(mask));

      gsap.set(heroTitleWordMasks, {
        paddingLeft: "0.08em",
        paddingRight: "0.08em",
        marginLeft: "-0.08em",
        marginRight: "-0.08em",
      });

      type PreloaderCardMetrics = {
        left: number;
        top: number;
        width: number;
        height: number;
        rotation: number;
        borderRadius: string;
        borderWidth: string;
      };

      type HeroFrameTarget = {
        left: number;
        top: number;
        width: number;
        height: number;
        rotation: number;
        borderRadius: string;
        borderWidth: string;
      };

      let startHeroMotion = () => {};
      let measureHeroFrameTarget: () => HeroFrameTarget | null = () => null;
      let getPreloaderCardMetrics: (gapOverride?: string) => PreloaderCardMetrics =
        () => {
          const width =
            window.innerWidth <= 1000
              ? Math.max(Math.min(window.innerWidth * 0.2, 200), 88)
              : Math.max(Math.min(window.innerWidth * 0.1, 180), 120);
          const height = width * 1.4;

          return {
            left: window.innerWidth / 2 - width / 2,
            top: window.innerHeight / 2 - height / 2,
            width,
            height,
            rotation: 0,
            borderRadius: "0px",
            borderWidth: "1px",
          };
        };
      let setHeroFrameToPreloaderState: (
        metrics?: PreloaderCardMetrics,
      ) => void = () => {};

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
        let isHeroMotionRunning = false;

        const renderHeroFrame = () => {
          const scaledMovementMultiplier =
            (1 - animationState.scale) * animationState.movementMultiplier;
          const maxHorizontalMovement =
            !isPreloaderActiveRef.current &&
            window.innerWidth >= 900 &&
            animationState.scale < 0.95
              ? animationState.targetMouseX * scaledMovementMultiplier
              : 0;

          animationState.currentMouseX = gsap.utils.interpolate(
            animationState.currentMouseX,
            maxHorizontalMovement,
            isPreloaderActiveRef.current ? 0.12 : 0.05,
          );

          gsap.set(heroFrame, {
            x: animationState.currentMouseX,
            yPercent: animationState.yPercent,
            scale: animationState.scale,
            rotation: animationState.rotation,
            autoAlpha: 1,
            transformOrigin: "center center",
          });

          heroAnimationFrame = window.requestAnimationFrame(renderHeroFrame);
        };

        const handleMouseMove = (event: globalThis.MouseEvent) => {
          if (isPreloaderActiveRef.current) {
            return;
          }

          animationState.targetMouseX =
            (event.clientX / window.innerWidth - 0.5) * 2;
        };

        const handleHeroResize = () => {
          animationState.movementMultiplier = getMovementMultiplier();

          if (window.innerWidth < 900) {
            animationState.targetMouseX = 0;
          }

          if (isPreloaderActiveRef.current) {
            setHeroFrameToPreloaderState();
          }
        };

        getPreloaderCardMetrics = (gapOverride?: string) => {
          const currentGap = preloaderGallery
            ? window.getComputedStyle(preloaderGallery).gap
            : null;

          if (preloaderGallery && currentGap && gapOverride) {
            gsap.set(preloaderGallery, { gap: gapOverride });
          }

          const slotRect = preloaderCenterSlot?.getBoundingClientRect();

          if (preloaderGallery && currentGap && gapOverride) {
            gsap.set(preloaderGallery, { gap: currentGap });
          }

          if (slotRect) {
            return {
              left: slotRect.left,
              top: slotRect.top,
              width: slotRect.width,
              height: slotRect.height,
              rotation: 0,
              borderRadius: "0px",
              borderWidth: "1px",
            };
          }

          const width =
            window.innerWidth <= 1000
              ? Math.max(Math.min(window.innerWidth * 0.2, 200), 88)
              : Math.max(Math.min(window.innerWidth * 0.1, 180), 120);
          const height = width * 1.4;

          return {
            left: window.innerWidth / 2 - width / 2,
            top: window.innerHeight / 2 - height / 2,
            width,
            height,
            rotation: 0,
            borderRadius: "0px",
            borderWidth: "1px",
          };
        };

        measureHeroFrameTarget = () => {
          gsap.set(heroFrame, {
            clearProps:
              "position,left,top,width,height,zIndex,pointerEvents,borderWidth,borderRadius,borderColor",
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            rotation: 0,
            autoAlpha: 1,
            transformOrigin: "center center",
          });

          const layoutRect = heroFrame.getBoundingClientRect();
          const styles = window.getComputedStyle(heroFrame);
          const naturalBorderRadius = parseFloat(styles.borderTopLeftRadius) || 0;
          const naturalBorderWidth = parseFloat(styles.borderTopWidth) || 0;

          gsap.set(heroFrame, {
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: animationState.yPercent,
            scale: animationState.scale,
            rotation: animationState.rotation,
            autoAlpha: 1,
            transformOrigin: "center center",
          });

          const finalBounds = heroFrame.getBoundingClientRect();
          const centerX = finalBounds.left + finalBounds.width / 2;
          const centerY = finalBounds.top + finalBounds.height / 2;
          const visibleWidth = layoutRect.width * animationState.scale;
          const visibleHeight = layoutRect.height * animationState.scale;

          return {
            left: centerX - visibleWidth / 2,
            top: centerY - visibleHeight / 2,
            width: visibleWidth,
            height: visibleHeight,
            rotation: animationState.rotation,
            borderRadius: `${naturalBorderRadius * animationState.scale}px`,
            borderWidth: `${Math.max(naturalBorderWidth * animationState.scale, 1)}px`,
          };
        };

        setHeroFrameToPreloaderState = (metrics = getPreloaderCardMetrics()) => {

          gsap.set(heroFrame, {
            position: "fixed",
            left: metrics.left,
            top: metrics.top,
            width: metrics.width,
            height: metrics.height,
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            rotation: metrics.rotation,
            zIndex: 100001,
            autoAlpha: 1,
            pointerEvents: "none",
            borderRadius: metrics.borderRadius,
            borderWidth: metrics.borderWidth,
            borderColor: "var(--otis-bg)",
            transformOrigin: "center center",
          });
        };

        startHeroMotion = () => {
          if (isHeroMotionRunning) {
            return;
          }

          isHeroMotionRunning = true;
          document.addEventListener("mousemove", handleMouseMove);
          window.addEventListener("resize", handleHeroResize);
          renderHeroFrame();
        };

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

        if (!shouldRunPreloader) {
          isPreloaderActiveRef.current = false;
          isHeroImageFrozenRef.current = true;
          gsap.set(heroFrame, {
            clearProps:
              "position,left,top,width,height,zIndex,pointerEvents,borderWidth,borderRadius,borderColor",
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: animationState.yPercent,
            scale: animationState.scale,
            rotation: animationState.rotation,
            autoAlpha: 1,
            transformOrigin: "center center",
          });
          startHeroMotion();
        }

        media.add("all", () => {
          return () => {
            heroScrollTrigger.kill();
            isHeroMotionRunning = false;
            document.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("resize", handleHeroResize);
            window.cancelAnimationFrame(heroAnimationFrame);
          };
        });
      }

      if (
        preloaderRoot &&
        preloaderPanel &&
        preloaderCounter &&
        preloaderCopyTrack &&
        preloaderGallery &&
        preloaderCenterSlot &&
        heroFrame &&
        preloaderImages.length > 0
      ) {
        const counterValue = { value: 0 };
        const preloaderCompactGap = window.innerWidth <= 1000 ? "1vw" : "0.75vw";
        const initialSlotMetrics = getPreloaderCardMetrics();
        const compactSlotMetrics = getPreloaderCardMetrics(preloaderCompactGap);
        const heroFrameTarget = measureHeroFrameTarget();

        gsap.set(preloaderImages, {
          yPercent: 50,
          scale: 0.5,
          autoAlpha: 0,
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          transformOrigin: "center center",
        });
        gsap.set(preloaderPanel, {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        });
        gsap.set(preloaderCopyTrack, {
          y: "1.25rem",
        });
        gsap.set(heroTitleWords, {
          yPercent: 100,
        });
        setHeroFrameToPreloaderState(initialSlotMetrics);
        gsap.set(heroFrame, {
          yPercent: 50,
          scale: 0.5,
          autoAlpha: 0,
          rotation: 0,
          borderRadius: "0px",
          borderWidth: "1px",
        });

        const counterTl = gsap.timeline({ delay: 0.5 });
        const overlayCopyTl = gsap.timeline({ delay: 0.75 });
        const revealTl = gsap.timeline({
          delay: 0.5,
          onComplete: () => {
            isPreloaderActiveRef.current = false;
            isHeroImageFrozenRef.current = false;
            gsap.set(preloaderRoot, {
              autoAlpha: 0,
              pointerEvents: "none",
            });
            startHeroMotion();
            setBodyLockState(false);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            window.scrollTo(0, 0);
            window.requestAnimationFrame(() => {
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              window.scrollTo(0, 0);
            });
          },
        });

        counterTl.to(counterValue, {
          value: 100,
          duration: 5,
          ease: "power2.out",
          onUpdate: () => {
            preloaderCounter.textContent = Math.floor(counterValue.value).toString();
          },
        });

        overlayCopyTl
          .to(preloaderCopyTrack, {
            y: "0rem",
            duration: 0.75,
            ease: "hop",
          })
          .to(preloaderCopyTrack, {
            y: "-1.25rem",
            duration: 0.75,
            ease: "hop",
            delay: 0.75,
          })
          .to(preloaderCopyTrack, {
            y: "-2.5rem",
            duration: 0.75,
            ease: "hop",
            delay: 0.75,
          })
          .to(preloaderCopyTrack, {
            y: "-3.75rem",
            duration: 0.75,
            ease: "hop",
            delay: 1,
          });

        revealTl
          .to(preloaderImages, {
            yPercent: 0,
            autoAlpha: 1,
            stagger: 0.05,
            duration: 1,
            ease: "hop",
          })
          .to(
            heroFrame,
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 1,
              ease: "hop",
            },
            "<",
          )
          .to(preloaderGallery, {
            gap: preloaderCompactGap,
            duration: 1,
            delay: 0.45,
            ease: "hop",
          })
          .to(
            heroFrame,
            {
              left: compactSlotMetrics.left,
              top: compactSlotMetrics.top,
              width: compactSlotMetrics.width,
              height: compactSlotMetrics.height,
              scale: 1,
              duration: 1,
              ease: "hop",
            },
            "<",
          )
          .to(
            preloaderImages,
            {
              scale: 1,
              duration: 1,
              ease: "hop",
            },
            "<",
          )
          .to(preloaderImages, {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
            duration: 0.85,
            stagger: 0.1,
            ease: "hop",
          })
          .add(() => {
            isHeroImageFrozenRef.current = true;
          })
          .to(
            heroFrame,
            {
              left: () => heroFrameTarget?.left ?? 0,
              top: () => heroFrameTarget?.top ?? 0,
              width: () => heroFrameTarget?.width ?? heroFrame.offsetWidth,
              height: () => heroFrameTarget?.height ?? heroFrame.offsetHeight,
              rotation: () => heroFrameTarget?.rotation ?? -15,
              borderRadius: () => heroFrameTarget?.borderRadius ?? "0.5em",
              borderWidth: () => heroFrameTarget?.borderWidth ?? "1px",
              borderColor: "var(--otis-fg)",
              duration: 1.05,
              ease: "hop",
            },
            ">",
          )
          .add(() => {
            gsap.set(heroFrame, {
              clearProps:
                "position,left,top,width,height,zIndex,pointerEvents,borderWidth,borderRadius,borderColor",
              x: 0,
              y: 0,
              xPercent: 0,
              yPercent: -110,
              scale: 0.25,
              rotation: -15,
              autoAlpha: 1,
              transformOrigin: "center center",
            });
          })
          .to(preloaderPanel, {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
            duration: 1,
            ease: "hop",
          }, "-=0.55")
          .to(
            heroTitleWords,
            {
              yPercent: 0,
              duration: 0.75,
              stagger: 0.1,
              ease: "power3.out",
            },
            "-=0.5",
          );
      }

      media.add("(min-width: 1001px)", () => {
        const cleanupTweens: Array<gsap.core.Animation | ScrollTrigger> = [];
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
        splitHeroTitles.forEach((title) => {
          title.revert();
        });
        media.revert();
      };
    },
    { scope: rootRef },
  );

  const handleInternalLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    target: string,
  ) => {
    if (isPreloaderActiveRef.current) {
      event.preventDefault();
      return;
    }

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

    scrollToTarget();
  };

  return (
    <main
      ref={rootRef}
      className="relative min-h-screen overflow-x-hidden bg-[var(--otis-bg)] text-[var(--otis-fg)] [--otis-accent1:#ed6a5a] [--otis-accent2:#f4f1bb] [--otis-accent3:#9bc1bc] [--otis-accent4:#5d576b] [--otis-bg:#edf1e8] [--otis-bg2:#d7dbd2] [--otis-fg:#141414]"
    >
      {shouldRunPreloader ? <TransitionOverlay /> : null}

      <div className="relative w-screen overflow-x-hidden">
        <HeroSection heroImageRef={heroImageRef} />
        <AboutDescriptionSection />
        {/* <FeaturedWorkSection onInternalLinkClick={handleInternalLinkClick} /> */}
        <ServicesHeaderSection />
        <ServicesStackSection />
        <ContactCtaSection />
      </div>
    </main>
  );
}
