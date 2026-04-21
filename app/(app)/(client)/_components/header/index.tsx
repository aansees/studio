"use client";

import "./header.css";

import { useEffect, useRef } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useViewTransition } from "../use-view-transition";
import AnimatedButton from "../animated-button/animated-button";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function Header() {
  const topBarRef = useRef<HTMLDivElement | null>(null);
  const { navigateWithTransition } = useViewTransition();

  useEffect(() => {
    const topBar = topBarRef.current;
    if (!topBar) return;

    const topBarHeight = topBar.offsetHeight;
    let lastScrollY = 0;
    let isScrolling = false;

    gsap.set(topBar, { y: 0 });

    const handleScroll = () => {
      if (isScrolling) return;

      isScrolling = true;
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? 1 : -1;

      if (direction === 1 && currentScrollY > 50) {
        gsap.to(topBar, {
          y: -topBarHeight,
          duration: 1,
          ease: "power4.out",
        });
      } else if (direction === -1) {
        gsap.to(topBar, {
          y: 0,
          duration: 1,
          ease: "power4.out",
        });
      }

      lastScrollY = currentScrollY;

      setTimeout(() => {
        isScrolling = false;
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (topBarRef.current) {
      gsap.set(topBarRef.current, { y: 0 });
    }
  }, []);

  return (
    <div className="top-bar" ref={topBarRef}>
      <div className="pointer-events-auto rounded-[0.4em] px-[0.65em] py-[0.5em]">
        <Link
          className="font-otis-mono text-[0.875rem] font-medium uppercase leading-[1.125] text-[var(--otis-bg)]"
          href="/"
        >
          Ancs ✦ Studio
        </Link>
      </div>
      <div className="top-bar-cta">
        <AnimatedButton label="Reserve" route="/connect" animate={false} />
      </div>
    </div>
  );
}
