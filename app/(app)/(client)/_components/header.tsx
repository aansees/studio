"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { HomeNav } from "./home-nav";
import type { InternalLinkHandler } from "./home-config";

type BodyLockStyles = {
  overflow: string;
  position: string;
  top: string;
  width: string;
};

export function Header() {
  const rootRef = useRef<HTMLDivElement>(null);
  const isMenuAnimatingRef = useRef(false);
  const bodyLockStylesRef = useRef<BodyLockStyles | null>(null);
  const scrollYRef = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigateHomeAnchor = useCallback(
    (target: string) => {
      router.push(target === "top" ? "/" : `/#${target}`);
    },
    [router],
  );

  const getMenuElements = useCallback(() => {
    const root = rootRef.current;

    if (!root) {
      return null;
    }

    return {
      closeLabel: root.querySelector<HTMLElement>("[data-close-label]"),
      navFooterCopies: gsap.utils.toArray<HTMLElement>(
        "[data-nav-footer-copy]",
        root,
      ),
      navFooterHeaders: gsap.utils.toArray<HTMLElement>(
        "[data-nav-footer-header]",
        root,
      ),
      navItems: gsap.utils.toArray<HTMLElement>("[data-nav-item]", root),
      navOverlay: root.querySelector<HTMLElement>("[data-nav-overlay]"),
      openLabel: root.querySelector<HTMLElement>("[data-open-label]"),
    };
  }, []);

  const resetMenuVisualState = useCallback(() => {
    const elements = getMenuElements();

    if (!elements) {
      return;
    }

    const {
      closeLabel,
      navFooterCopies,
      navFooterHeaders,
      navItems,
      navOverlay,
      openLabel,
    } = elements;

    gsap.set([...navItems, ...navFooterHeaders, ...navFooterCopies], {
      opacity: 0,
      y: "100%",
    });

    if (navOverlay) {
      gsap.set(navOverlay, { opacity: 0 });
    }

    if (openLabel) {
      gsap.set(openLabel, { y: "0rem" });
    }

    if (closeLabel) {
      gsap.set(closeLabel, { y: "0rem" });
    }
  }, [getMenuElements]);

  const lockBody = useCallback(() => {
    const { style } = document.body;

    bodyLockStylesRef.current = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      width: style.width,
    };

    scrollYRef.current = window.scrollY;
    style.position = "fixed";
    style.top = `-${scrollYRef.current}px`;
    style.width = "100%";
    style.overflow = "hidden";
  }, []);

  const unlockBody = useCallback((restoreScroll = true) => {
    const bodyLockStyles = bodyLockStylesRef.current;

    if (!bodyLockStyles) {
      return;
    }

    const { style } = document.body;
    style.position = bodyLockStyles.position;
    style.top = bodyLockStyles.top;
    style.width = bodyLockStyles.width;
    style.overflow = bodyLockStyles.overflow;

    if (restoreScroll) {
      window.scrollTo(0, scrollYRef.current);
    }

    bodyLockStylesRef.current = null;
  }, []);

  const setMenuState = (nextState: boolean, onComplete?: () => void) => {
    const elements = getMenuElements();

    if (!elements) {
      return;
    }

    const {
      closeLabel,
      navFooterCopies,
      navFooterHeaders,
      navItems,
      navOverlay,
      openLabel,
    } = elements;

    if (!navOverlay || !openLabel || !closeLabel) {
      return;
    }

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
      lockBody();
      setIsMenuOpen(true);

      gsap.to(openLabel, { y: "-1rem", duration: 0.3 });
      gsap.to(closeLabel, { y: "-1rem", duration: 0.3 });
      gsap.to(navOverlay, {
        opacity: 1,
        duration: 0.3,
        onComplete: () => {
          isMenuAnimatingRef.current = false;
          onComplete?.();
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
    unlockBody();
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
        onComplete?.();
      },
    });
  };

  const navigateToTarget = (target: string) => {
    if (target.startsWith("/")) {
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
  };

  const handleInternalLinkClick: InternalLinkHandler = (event, target) => {
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
  };

  useEffect(() => {
    resetMenuVisualState();

    return () => {
      unlockBody(false);
    };
  }, [resetMenuVisualState, unlockBody]);

  return (
    <div ref={rootRef}>
      <HomeNav
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setMenuState(!isMenuOpen)}
        onInternalLinkClick={handleInternalLinkClick}
      />
    </div>
  );
}
