"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { TransitionRouter } from "next-transition-router";

gsap.registerPlugin(DrawSVGPlugin);

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const transitionOverlayRef = useRef<HTMLDivElement>(null);
  const svgPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!svgPathRef.current) {
      return;
    }

    gsap.set(svgPathRef.current, {
      drawSVG: "0%",
      strokeWidth: 2,
    });
  }, []);

  return (
    <TransitionRouter
      auto
      leave={(next) => {
        if (!transitionOverlayRef.current || !svgPathRef.current) {
          next();
          return () => undefined;
        }

        const tl = gsap.timeline({ onComplete: next });

        tl.to(transitionOverlayRef.current, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        }).to(
          svgPathRef.current,
          {
            drawSVG: "100%",
            strokeWidth: 300,
            duration: 1.5,
            ease: "power2.inOut",
          },
          0,
        );

        return () => tl.kill();
      }}
      enter={(next) => {
        if (!transitionOverlayRef.current || !svgPathRef.current) {
          next();
          return () => undefined;
        }

        const tl = gsap.timeline({ onComplete: next });

        tl.to(svgPathRef.current, {
          drawSVG: "100% 100%",
          strokeWidth: 2,
          duration: 1.5,
          ease: "power2.inOut",
        })
          .to(
            transitionOverlayRef.current,
            {
              opacity: 0,
              duration: 0.5,
              ease: "power2.inOut",
            },
            1,
          )
          .set(svgPathRef.current, {
            drawSVG: "0%",
            strokeWidth: 2,
          });

        return () => tl.kill();
      }}
    >
      <div
        ref={transitionOverlayRef}
        className="pointer-events-none fixed inset-0 z-999 flex items-center justify-center opacity-0"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1316 664"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full scale-[1.3]"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            ref={svgPathRef}
            d="M13.4746 291.27C13.4746 291.27 100.646 -18.6724 255.617 16.8418C410.588 52.356 61.0296 431.197 233.017 546.326C431.659 679.299 444.494 21.0125 652.73 100.784C860.967 180.556 468.663 430.709 617.216 546.326C765.769 661.944 819.097 48.2722 988.501 120.156C1174.21 198.957 809.424 543.841 988.501 636.726C1189.37 740.915 1301.67 149.213 1301.67 149.213"
            stroke="#82A0FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {children}
    </TransitionRouter>
  );
}
