"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { useLenis } from "lenis/react";
import MenuBtn from "./menu-btn/menu-btn";
import { useViewTransition } from "../use-view-transition";

gsap.registerPlugin(SplitText, CustomEase);

export default function Menu() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isNearPageBottom, setIsNearPageBottom] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const splitTextRefs = useRef<SplitText[]>([]);
  const lenis = useLenis();
  const { navigateWithTransition } = useViewTransition();

  const resetMenuState = useCallback(() => {
    const menu = menuRef.current;

    setIsOpen(false);
    setIsAnimating(false);
    setIsNavigating(false);
    document.body.classList.remove("menu-open");

    if (!menu) {
      return;
    }

    gsap.killTweensOf(menu);
    gsap.set(menu, {
      clipPath: "circle(0% at 50% 50%)",
      pointerEvents: "none",
    });

    splitTextRefs.current.forEach((split) => {
      gsap.killTweensOf(split.lines as HTMLElement[]);
      gsap.set(split.lines as HTMLElement[], { y: "120%" });
    });
  }, []);

  useEffect(() => {
    const updateMenuBtnVisibility = () => {
      const root = document.documentElement;
      const viewportBottom = window.scrollY + window.innerHeight;
      const hideThreshold = root.scrollHeight - 400;

      setIsNearPageBottom(viewportBottom >= hideThreshold);
    };

    updateMenuBtnVisibility();

    window.addEventListener("scroll", updateMenuBtnVisibility, {
      passive: true,
    });
    window.addEventListener("resize", updateMenuBtnVisibility);

    return () => {
      window.removeEventListener("scroll", updateMenuBtnVisibility);
      window.removeEventListener("resize", updateMenuBtnVisibility);
    };
  }, []);

  useEffect(() => {
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, []);

  useEffect(() => {
    resetMenuState();
  }, [pathname, resetMenuState]);

  useEffect(() => {
    if (!lenis) {
      return;
    }

    if (isOpen) {
      lenis.stop();
      return;
    }

    lenis.start();
  }, [lenis, isOpen]);

  useLayoutEffect(() => {
    CustomEase.create(
      "hop",
      "M0,0 C0.354,0 0.464,0.133 0.498,0.502 0.532,0.872 0.651,1 1,1",
    );
  }, []);

  useLayoutEffect(() => {
    if (!menuRef.current) {
      return;
    }

    const menu = menuRef.current;

    splitTextRefs.current.forEach((split) => {
      split.revert();
    });
    splitTextRefs.current = [];

    gsap.set(menu, {
      clipPath: "circle(0% at 50% 50%)",
      pointerEvents: "none",
    });

    const h2Elements = menu.querySelectorAll("h2");
    const pElements = menu.querySelectorAll("p");

    h2Elements.forEach((h2) => {
      const split = SplitText.create(h2, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
      });
      const splitLines = split.lines as HTMLElement[];

      gsap.set(splitLines, { y: "120%" });
      splitLines.forEach((line) => {
        line.style.pointerEvents = "auto";
      });
      splitTextRefs.current.push(split);
    });

    pElements.forEach((p) => {
      const split = SplitText.create(p, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
      });
      const splitLines = split.lines as HTMLElement[];

      gsap.set(splitLines, { y: "120%" });
      splitLines.forEach((line) => {
        line.style.pointerEvents = "auto";
      });
      splitTextRefs.current.push(split);
    });

    isInitializedRef.current = true;
  }, []);

  const animateMenu = useCallback((open: boolean) => {
    if (!menuRef.current) {
      return;
    }

    const menu = menuRef.current;
    setIsAnimating(true);

    if (open) {
      document.body.classList.add("menu-open");

      gsap.to(menu, {
        clipPath: "circle(100% at 50% 50%)",
        ease: "power3.out",
        duration: 2,
        onStart: () => {
          menu.style.pointerEvents = "all";

          splitTextRefs.current.forEach((split, index) => {
            gsap.to(split.lines as HTMLElement[], {
              y: "0%",
              stagger: 0.05,
              delay: 0.35 + index * 0.1,
              duration: 1,
              ease: "power4.out",
            });
          });
        },
        onComplete: () => {
          setIsAnimating(false);
        },
      });
      return;
    }

    const textTimeline = gsap.timeline({
      onStart: () => {
        gsap.to(menu, {
          clipPath: "circle(0% at 50% 50%)",
          ease: "power3.out",
          duration: 1,
          delay: 0.75,
          onComplete: () => {
            menu.style.pointerEvents = "none";

            splitTextRefs.current.forEach((split) => {
              gsap.set(split.lines as HTMLElement[], { y: "120%" });
            });

            document.body.classList.remove("menu-open");
            setIsAnimating(false);
            setIsNavigating(false);
          },
        });
      },
    });

    splitTextRefs.current.forEach((split, index) => {
      textTimeline.to(
        split.lines as HTMLElement[],
        {
          y: "-120%",
          stagger: 0.03,
          delay: index * 0.05,
          duration: 1,
          ease: "power3.out",
        },
        0,
      );
    });
  }, []);

  const toggleMenu = useCallback(() => {
    if (!isAnimating && isInitializedRef.current && !isNavigating) {
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
      animateMenu(nextOpen);
    }
  }, [animateMenu, isAnimating, isNavigating, isOpen]);

  const handleLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      event.preventDefault();

      if (window.location.pathname === href) {
        if (isOpen) {
          setIsOpen(false);
          animateMenu(false);
        }
        return;
      }

      if (isNavigating) {
        return;
      }

      setIsNavigating(true);
      setIsOpen(false);
      document.body.classList.remove("menu-open");

      if (menuRef.current) {
        gsap.killTweensOf(menuRef.current);
        menuRef.current.style.pointerEvents = "none";
      }

      navigateWithTransition(href);
    },
    [animateMenu, isNavigating, isOpen, navigateWithTransition],
  );

  return (
    <div>
      <MenuBtn
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        isHidden={isNearPageBottom && !isOpen}
      />
      <div className="menu" ref={menuRef}>
        <div className="menu-wrapper">
          <div className="col col-1">
            <div className="links">
              <div className="link">
                <Link href="/" onClick={(event) => handleLinkClick(event, "/")}>
                  <h2>Home</h2>
                </Link>
              </div>
              <div className="link">
                <Link href="/studio" onClick={(event) => handleLinkClick(event, "/studio")}>
                  <h2>Studio</h2>
                </Link>
              </div>
              <div className="link">
                <Link href="/projects" onClick={(event) => handleLinkClick(event, "/projects")}>
                  <h2>Projects</h2>
                </Link>
              </div>
              <div className="link">
                <Link href="/connect" onClick={(event) => handleLinkClick(event, "/connect")}>
                  <h2>Connect</h2>
                </Link>
              </div>
            </div>
          </div>
          <div className="col col-2">
            <div className="socials">
              <div className="sub-col">
                <div className="menu-meta menu-commissions">
                  <p>New Business</p>
                  <p>build@ancs.studio</p>
                  <p>+1 (872) 441-2086</p>
                </div>
                <div className="menu-meta">
                  <p>What We Build</p>
                  <p>Websites and systems</p>
                  <p>Android apps and interactive launches</p>
                </div>
              </div>
              <div className="sub-col">
                <div className="menu-meta">
                  <p>Social</p>
                  <p>Instagram</p>
                  <p>Are.na</p>
                  <p>LinkedIn</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
