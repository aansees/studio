"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { HomeNav } from "./home-nav";
import type { InternalLinkHandler } from "./home-config";

gsap.registerPlugin(SplitText);

type BodyLockStyles = {
  htmlOverflow: string;
  overflow: string;
  position: string;
  top: string;
  width: string;
};

type MenuElements = {
  closeLabel: HTMLElement | null;
  defaultLink: HTMLElement | null;
  highlighter: HTMLElement | null;
  linkItems: HTMLElement[];
  linkTrack: HTMLElement | null;
  metaCopies: HTMLElement[];
  navImage: HTMLElement | null;
  navOverlay: HTMLElement | null;
  openLabel: HTMLElement | null;
};

type LinkCharGroups = {
  primary: HTMLElement[];
  secondary: HTMLElement[];
};

export function Header() {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const isMenuAnimatingRef = useRef(false);
  const bodyLockStylesRef = useRef<BodyLockStyles | null>(null);
  const scrollYRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const splitTextInstancesRef = useRef<SplitText[]>([]);
  const linkCharGroupsRef = useRef(new Map<HTMLElement, LinkCharGroups>());
  const currentTrackXRef = useRef(0);
  const targetTrackXRef = useRef(0);
  const currentHighlighterXRef = useRef(0);
  const targetHighlighterXRef = useRef(0);
  const currentHighlighterWidthRef = useRef(0);
  const targetHighlighterWidthRef = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeMenuTarget = pathname.startsWith("/featured-work")
    ? "/featured-work"
    : "top";

  const navigateHomeAnchor = useCallback(
    (target: string) => {
      router.push(target === "top" ? "/" : `/#${target}`);
    },
    [router],
  );

  const getMenuElements = useCallback((): MenuElements | null => {
    const root = rootRef.current;

    if (!root) {
      return null;
    }

    return {
      closeLabel: root.querySelector<HTMLElement>("[data-close-label]"),
      defaultLink: root.querySelector<HTMLElement>("[data-nav-default='true']"),
      highlighter: root.querySelector<HTMLElement>("[data-nav-highlighter]"),
      linkItems: gsap.utils.toArray<HTMLElement>("[data-nav-item]", root),
      linkTrack: root.querySelector<HTMLElement>("[data-nav-links-track]"),
      metaCopies: gsap.utils.toArray<HTMLElement>("[data-nav-meta-copy]", root),
      navImage: root.querySelector<HTMLElement>("[data-nav-image]"),
      navOverlay: root.querySelector<HTMLElement>("[data-nav-overlay]"),
      openLabel: root.querySelector<HTMLElement>("[data-open-label]"),
    };
  }, []);

  const positionHighlighter = useCallback(
    (linkItem?: HTMLElement | null, immediate = false) => {
      const elements = getMenuElements();

      if (!elements?.linkTrack || !elements.highlighter) {
        return;
      }

      const targetLink = linkItem ?? elements.defaultLink ?? elements.linkItems[0];
      const label = targetLink?.querySelector<HTMLElement>("[data-nav-link-label]");

      if (!targetLink || !label) {
        return;
      }

      const labelRect = label.getBoundingClientRect();
      const trackRect = elements.linkTrack.getBoundingClientRect();
      const nextX = labelRect.left - trackRect.left;
      const nextWidth = labelRect.width;

      targetHighlighterXRef.current = nextX;
      targetHighlighterWidthRef.current = nextWidth;

      if (!immediate) {
        return;
      }

      currentHighlighterXRef.current = nextX;
      currentHighlighterWidthRef.current = nextWidth;

      gsap.set(elements.highlighter, {
        x: nextX,
        width: nextWidth,
      });
    },
    [getMenuElements],
  );

  const resetMenuVisualState = useCallback(() => {
    const elements = getMenuElements();

    if (!elements) {
      return;
    }

    const {
      closeLabel,
      highlighter,
      linkItems,
      linkTrack,
      metaCopies,
      navImage,
      navOverlay,
      openLabel,
    } = elements;

    gsap.set(linkItems, { yPercent: 150 });
    gsap.set(metaCopies, { yPercent: 100 });

    linkCharGroupsRef.current.forEach(({ primary, secondary }) => {
      gsap.set(primary, {
        rotateX: 0,
        rotateY: 0,
        yPercent: 0,
      });
      gsap.set(secondary, {
        rotateX: 90,
        rotateY: 0,
        yPercent: 110,
      });
    });

    if (navOverlay) {
      gsap.set(navOverlay, {
        clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
      });
    }

    if (navImage) {
      gsap.set(navImage, {
        y: 0,
        scale: 0.72,
        opacity: 0.22,
      });
    }

    if (highlighter) {
      gsap.set(highlighter, { yPercent: 150 });
    }

    if (openLabel) {
      gsap.set(openLabel, { yPercent: 0 });
    }

    if (closeLabel) {
      gsap.set(closeLabel, { yPercent: 0 });
    }

    if (linkTrack) {
      currentTrackXRef.current = 0;
      targetTrackXRef.current = 0;
      gsap.set(linkTrack, { x: 0 });
    }

    positionHighlighter(undefined, true);
  }, [getMenuElements, positionHighlighter]);

  const lockBody = useCallback(() => {
    const bodyStyle = document.body.style;

    bodyLockStylesRef.current = {
      htmlOverflow: document.documentElement.style.overflow,
      overflow: bodyStyle.overflow,
      position: bodyStyle.position,
      top: bodyStyle.top,
      width: bodyStyle.width,
    };

    scrollYRef.current = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollYRef.current}px`;
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";
  }, []);

  const unlockBody = useCallback((restoreScroll = true) => {
    const bodyLockStyles = bodyLockStylesRef.current;

    if (!bodyLockStyles) {
      return;
    }

    const bodyStyle = document.body.style;
    document.documentElement.style.overflow = bodyLockStyles.htmlOverflow;
    bodyStyle.position = bodyLockStyles.position;
    bodyStyle.top = bodyLockStyles.top;
    bodyStyle.width = bodyLockStyles.width;
    bodyStyle.overflow = bodyLockStyles.overflow;

    if (restoreScroll) {
      window.scrollTo(0, scrollYRef.current);
    }

    bodyLockStylesRef.current = null;
  }, []);

  const animateLinkChars = useCallback((linkItem: HTMLElement, isActive: boolean) => {
    const charGroups = linkCharGroupsRef.current.get(linkItem);

    if (!charGroups) {
      return;
    }

    gsap.to(charGroups.primary, {
      rotateX: isActive ? -90 : 0,
      yPercent: isActive ? -110 : 0,
      duration: 0.5,
      ease: "expo.out",
      force3D: true,
      overwrite: "auto",
      stagger: 0.025,
      transformOrigin: "50% 100%",
    });

    gsap.to(charGroups.secondary, {
      rotateX: isActive ? 0 : 90,
      yPercent: isActive ? 0 : 110,
      duration: 0.5,
      ease: "expo.out",
      force3D: true,
      overwrite: "auto",
      stagger: 0.025,
      transformOrigin: "50% 0%",
    });
  }, []);

  const setMenuState = useCallback(
    (nextState: boolean, onComplete?: () => void) => {
      const elements = getMenuElements();

      if (!elements || isMenuAnimatingRef.current) {
        return;
      }

      const {
        closeLabel,
        highlighter,
        linkItems,
        metaCopies,
        navImage,
        navOverlay,
        openLabel,
      } = elements;

      if (!navOverlay || !openLabel || !closeLabel) {
        return;
      }

      timelineRef.current?.kill();

      if (nextState) {
        isMenuAnimatingRef.current = true;
        lockBody();
        setIsMenuOpen(true);
        positionHighlighter(undefined, true);

        timelineRef.current = gsap.timeline({
          defaults: { ease: "expo.out" },
          onComplete: () => {
            isMenuAnimatingRef.current = false;
            positionHighlighter(undefined, true);
            onComplete?.();
          },
        });

        timelineRef.current
          .to(openLabel, { yPercent: -100, duration: 0.85 }, 0)
          .to(closeLabel, { yPercent: -100, duration: 0.85 }, 0)
          .to(
            navOverlay,
            {
              clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
              duration: 1.05,
            },
            0,
          )
          .to(
            navImage,
            {
              scale: 1,
              opacity: 1,
              duration: 1.2,
            },
            0.06,
          )
          .to(
            linkItems,
            {
              yPercent: 0,
              duration: 1,
              stagger: 0.08,
            },
            0.18,
          )
          .to(
            metaCopies,
            {
              yPercent: 0,
              duration: 0.9,
              stagger: 0.03,
            },
            0.28,
          )
          .to(
            highlighter,
            {
              yPercent: 0,
              duration: 0.75,
            },
            0.52,
          );

        return;
      }

      isMenuAnimatingRef.current = true;

      timelineRef.current = gsap.timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          resetMenuVisualState();
          setIsMenuOpen(false);
          unlockBody();
          isMenuAnimatingRef.current = false;
          onComplete?.();
        },
      });

      timelineRef.current
        .to(openLabel, { yPercent: 0, duration: 0.8 }, 0)
        .to(closeLabel, { yPercent: 0, duration: 0.8 }, 0)
        .to(
          navImage,
          {
            y: "-18vh",
            opacity: 0.3,
            duration: 0.9,
          },
          0,
        )
        .to(
          metaCopies,
          {
            yPercent: -100,
            duration: 0.72,
            stagger: {
              each: 0.02,
              from: "end",
            },
          },
          0,
        )
        .to(
          linkItems,
          {
            yPercent: 150,
            duration: 0.85,
            stagger: {
              each: 0.05,
              from: "end",
            },
          },
          0.04,
        )
        .to(
          highlighter,
          {
            yPercent: 150,
            duration: 0.72,
          },
          0,
        )
        .to(
          navOverlay,
          {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
            duration: 0.95,
          },
          0.14,
        );
    },
    [getMenuElements, lockBody, positionHighlighter, resetMenuVisualState, unlockBody],
  );

  const navigateToTarget = useCallback(
    (target: string) => {
      if (target.startsWith("/")) {
        if (pathname === target) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        router.push(target);
        return;
      }

      if (target === "top") {
        if (pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        navigateHomeAnchor("top");
        return;
      }

      if (pathname === "/") {
        document.getElementById(target)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      navigateHomeAnchor(target);
    },
    [navigateHomeAnchor, pathname, router],
  );

  const handleInternalLinkClick: InternalLinkHandler = useCallback(
    (event, target) => {
      event.preventDefault();

      if (isMenuOpen) {
        setMenuState(false, () => {
          window.setTimeout(() => {
            navigateToTarget(target);
          }, 40);
        });
        return;
      }

      navigateToTarget(target);
    },
    [isMenuOpen, navigateToTarget, setMenuState],
  );

  useEffect(() => {
    resetMenuVisualState();

    const handleResize = () => {
      const elements = getMenuElements();

      if (elements?.linkTrack) {
        currentTrackXRef.current = 0;
        targetTrackXRef.current = 0;
        gsap.set(elements.linkTrack, { x: 0 });
      }

      positionHighlighter(undefined, true);
    };

    const frameId = window.requestAnimationFrame(() => {
      positionHighlighter(undefined, true);
    });

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      timelineRef.current?.kill();
      unlockBody(false);
    };
  }, [getMenuElements, positionHighlighter, resetMenuVisualState, unlockBody]);

  useEffect(() => {
    const elements = getMenuElements();

    if (!elements) {
      return;
    }

    const linkCharGroups = new Map<HTMLElement, LinkCharGroups>();

    splitTextInstancesRef.current.forEach((instance) => {
      instance.revert();
    });
    splitTextInstancesRef.current = [];
    linkCharGroupsRef.current = linkCharGroups;

    elements.linkItems.forEach((linkItem) => {
      const primaryCopy = linkItem.querySelector<HTMLElement>("[data-nav-link-primary]");
      const secondaryCopy = linkItem.querySelector<HTMLElement>(
        "[data-nav-link-secondary]",
      );

      if (!primaryCopy || !secondaryCopy) {
        return;
      }

      const primarySplit = new SplitText(primaryCopy, {
        type: "chars",
        charsClass: "menu-link-char",
      });
      const secondarySplit = new SplitText(secondaryCopy, {
        type: "chars",
        charsClass: "menu-link-char",
      });

      splitTextInstancesRef.current.push(primarySplit, secondarySplit);

      const primaryChars = primarySplit.chars.map((char) => char as HTMLElement);
      const secondaryChars = secondarySplit.chars.map((char) => char as HTMLElement);

      gsap.set([...primaryChars, ...secondaryChars], {
        display: "inline-block",
        force3D: true,
        marginLeft: "-0.02em",
        marginRight: "-0.04em",
        paddingLeft: "0.02em",
        paddingRight: "0.04em",
        transformPerspective: 1000,
        willChange: "transform",
      });

      linkCharGroups.set(linkItem, {
        primary: primaryChars,
        secondary: secondaryChars,
      });
    });

    resetMenuVisualState();

    return () => {
      splitTextInstancesRef.current.forEach((instance) => {
        instance.revert();
      });
      splitTextInstancesRef.current = [];

      if (linkCharGroupsRef.current === linkCharGroups) {
        linkCharGroupsRef.current = new Map<HTMLElement, LinkCharGroups>();
      }

      linkCharGroups.clear();
    };
  }, [getMenuElements, resetMenuVisualState]);

  useEffect(() => {
    const elements = getMenuElements();

    if (!elements?.navOverlay || !elements.linkTrack) {
      return;
    }

    const { highlighter, linkItems, linkTrack, navOverlay } = elements;

    const handleOverlayMouseMove = (event: globalThis.MouseEvent) => {
      if (window.innerWidth <= 1000) {
        return;
      }

      const viewportWidth = window.innerWidth;
      const trackWidth = linkTrack.offsetWidth;
      const maxMoveLeft = 0;
      const maxMoveRight = viewportWidth - trackWidth;
      const sensitivity = viewportWidth * 0.5;
      const startX = (viewportWidth - sensitivity) / 2;
      const endX = startX + sensitivity;

      let progress = 0;

      if (event.clientX <= startX) {
        progress = 0;
      } else if (event.clientX >= endX) {
        progress = 1;
      } else {
        progress = (event.clientX - startX) / sensitivity;
      }

      targetTrackXRef.current =
        maxMoveLeft + progress * (maxMoveRight - maxMoveLeft);
    };

    const handleTrackMouseLeave = () => {
      linkItems.forEach((linkItem) => {
        animateLinkChars(linkItem, false);
      });
      positionHighlighter(undefined);
    };

    const cleanups = linkItems.map((linkItem) => {
      const handleMouseEnter = () => {
        if (window.innerWidth <= 1000) {
          return;
        }

        animateLinkChars(linkItem, true);
        positionHighlighter(linkItem);
      };

      const handleMouseLeave = () => {
        if (window.innerWidth <= 1000) {
          return;
        }

        animateLinkChars(linkItem, false);
      };

      linkItem.addEventListener("mouseenter", handleMouseEnter);
      linkItem.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        linkItem.removeEventListener("mouseenter", handleMouseEnter);
        linkItem.removeEventListener("mouseleave", handleMouseLeave);
      };
    });

    const animate = () => {
      currentTrackXRef.current = gsap.utils.interpolate(
        currentTrackXRef.current,
        targetTrackXRef.current,
        0.08,
      );
      currentHighlighterXRef.current = gsap.utils.interpolate(
        currentHighlighterXRef.current,
        targetHighlighterXRef.current,
        0.12,
      );
      currentHighlighterWidthRef.current = gsap.utils.interpolate(
        currentHighlighterWidthRef.current,
        targetHighlighterWidthRef.current,
        0.12,
      );

      gsap.set(linkTrack, { x: currentTrackXRef.current });

      if (highlighter) {
        gsap.set(highlighter, {
          x: currentHighlighterXRef.current,
          width: currentHighlighterWidthRef.current,
        });
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    navOverlay.addEventListener("mousemove", handleOverlayMouseMove);
    linkTrack.addEventListener("mouseleave", handleTrackMouseLeave);
    animate();

    return () => {
      navOverlay.removeEventListener("mousemove", handleOverlayMouseMove);
      linkTrack.removeEventListener("mouseleave", handleTrackMouseLeave);
      cleanups.forEach((cleanup) => {
        cleanup();
      });

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [animateLinkChars, getMenuElements, positionHighlighter]);

  return (
    <div ref={rootRef}>
      <HomeNav
        activeMenuTarget={activeMenuTarget}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setMenuState(!isMenuOpen)}
        onInternalLinkClick={handleInternalLinkClick}
      />
    </div>
  );
}
