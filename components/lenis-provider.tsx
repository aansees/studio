"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface LenisProviderProps {
  children: ReactNode;
}

function createLenis(isMobile: boolean) {
  return new Lenis({
    duration: isMobile ? 1 : 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    syncTouch: true,
    lerp: isMobile ? 0.05 : 0.1,
    wheelMultiplier: 1,
    touchMultiplier: isMobile ? 1.5 : 2,
  });
}

export default function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    let isMobile = window.innerWidth <= 900;

    const initializeLenis = () => {
      const lenis = createLenis(isMobile);
      lenis.on("scroll", ScrollTrigger.update);
      lenisRef.current = lenis;
    };

    initializeLenis();

    const syncLenisWithGsap = (time: number) => {
      lenisRef.current?.raf(time * 1000);
    };

    gsap.ticker.add(syncLenisWithGsap);
    gsap.ticker.lagSmoothing(0);

    const handleResize = () => {
      const nextIsMobile = window.innerWidth <= 900;

      if (nextIsMobile === isMobile) {
        return;
      }

      isMobile = nextIsMobile;
      lenisRef.current?.destroy();
      initializeLenis();
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      gsap.ticker.remove(syncLenisWithGsap);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
