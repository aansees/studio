"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { RiArrowRightLine } from "@remixicon/react";
import { useViewTransition } from "../use-view-transition";

gsap.registerPlugin(SplitText, ScrollTrigger);

type AnimatedButtonProps = {
  label: string;
  route?: string;
  animate?: boolean;
  animateOnScroll?: boolean;
  delay?: number;
};

export default function AnimatedButton({
  label,
  route,
  animate = true,
  animateOnScroll = true,
  delay = 0,
}: AnimatedButtonProps) {
  const { navigateWithTransition } = useViewTransition();
  const buttonRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const circleRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const splitRef = useRef<SplitText | null>(null);

  const waitForFonts = async () => {
    try {
      await document.fonts.ready;

      const customFonts = ["Manrope"];
      const fontCheckPromises = customFonts.map((fontFamily) => {
        return document.fonts.load(`16px "${fontFamily}"`);
      });

      await Promise.all(fontCheckPromises);
      await new Promise((resolve) => setTimeout(resolve, 100));
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return true;
    }
  };

  useGSAP(
    () => {
      if (!buttonRef.current || !textRef.current) {
        return;
      }

      if (!animate) {
        gsap.set(buttonRef.current, { scale: 1 });
        gsap.set(circleRef.current, { scale: 1, opacity: 1 });
        gsap.set(iconRef.current, { opacity: 1, x: 0 });
        return;
      }

      const initializeAnimation = async () => {
        await waitForFonts();

        const split = SplitText.create(textRef.current, {
          type: "lines",
          mask: "lines",
          linesClass: "line++",
          lineThreshold: 0.1,
        });
        splitRef.current = split;

        gsap.set(buttonRef.current, { scale: 0, transformOrigin: "center" });
        gsap.set(circleRef.current, {
          scale: 0,
          transformOrigin: "center",
          opacity: 0,
        });
        gsap.set(iconRef.current, { opacity: 0, x: -20 });
        gsap.set(split.lines, { y: "100%", opacity: 0 });

        const tl = gsap.timeline({ delay });

        tl.to(buttonRef.current, {
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
        });

        tl.to(
          circleRef.current,
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "power3.out",
          },
          "+0.25",
        );

        tl.to(
          iconRef.current,
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: "power3.out",
          },
          "-0.25",
        );

        tl.to(
          split.lines,
          {
            y: "0%",
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power4.out",
          },
          "-=0.2",
        );

        if (animateOnScroll) {
          ScrollTrigger.create({
            trigger: buttonRef.current,
            start: "top 90%",
            once: true,
            animation: tl,
          });
        }
      };

      void initializeAnimation();

      return () => {
        splitRef.current?.revert();
      };
    },
    { scope: buttonRef, dependencies: [animate, animateOnScroll, delay] },
  );

  const buttonContent = (
    <>
      <span className="circle" ref={circleRef} aria-hidden="true"></span>
      <div className="icon" ref={iconRef}>
        <RiArrowRightLine />
      </div>
      <span className="button-text" ref={textRef}>
        {label}
      </span>
    </>
  );

  if (route) {
    return (
      <a
        href={route}
        className="btn"
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        onClick={(event) => {
          event.preventDefault();
          navigateWithTransition(route.startsWith("/") ? route : `/${route}`);
        }}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <button
      className="btn"
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      type="button"
    >
      {buttonContent}
    </button>
  );
}
