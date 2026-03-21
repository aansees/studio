"use client";

import {
  useRef,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type CopyProps = PropsWithChildren<{
  animateOnScroll?: boolean;
  delay?: number;
}> &
  HTMLAttributes<HTMLDivElement>;

export function Copy({
  children,
  animateOnScroll = true,
  delay = 0,
  className,
  ...props
}: CopyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splitRefs = useRef<SplitText[]>([]);
  const lineRefs = useRef<HTMLElement[]>([]);

  useGSAP(
    () => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      let isActive = true;

      const waitForFonts = async () => {
        try {
          await document.fonts.ready;
          await Promise.all([
            document.fonts.load("16px otis-display"),
            document.fonts.load("16px otis-body"),
            document.fonts.load("16px otis-mono"),
          ]);
          await new Promise((resolve) => window.setTimeout(resolve, 100));
        } catch {
          await new Promise((resolve) => window.setTimeout(resolve, 200));
        }
      };

      const initializeSplitText = async () => {
        await waitForFonts();

        if (!isActive || !containerRef.current) {
          return;
        }

        splitRefs.current.forEach((split) => split.revert());
        splitRefs.current = [];
        lineRefs.current = [];

        const elements = Array.from(container.children).filter(
          (child): child is HTMLElement => child instanceof HTMLElement,
        );

        elements.forEach((element) => {
          const split = SplitText.create(element, {
            type: "lines",
            mask: "lines",
            linesClass: "line++",
            lineThreshold: 0.1,
          });

          const textIndent = window.getComputedStyle(element).textIndent;

          const splitLines = split.lines.filter(
            (line): line is HTMLElement => line instanceof HTMLElement,
          );

          if (textIndent && textIndent !== "0px" && splitLines.length > 0) {
            splitLines[0].style.paddingLeft = textIndent;
            element.style.textIndent = "0";
          }

          splitRefs.current.push(split);
          lineRefs.current.push(...splitLines);
        });

        gsap.set(lineRefs.current, { yPercent: 100 });

        const animation = {
          yPercent: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power4.out",
          delay,
        };

        if (animateOnScroll) {
          gsap.to(lineRefs.current, {
            ...animation,
            scrollTrigger: {
              trigger: container,
              start: "top 90%",
              once: true,
            },
          });
          return;
        }

        gsap.to(lineRefs.current, animation);
      };

      void initializeSplitText();

      return () => {
        isActive = false;
        splitRefs.current.forEach((split) => split.revert());
        splitRefs.current = [];
        lineRefs.current = [];
      };
    },
    { scope: containerRef, dependencies: [animateOnScroll, delay] },
  );

  return (
    <div
      ref={containerRef}
      className={className}
      data-copy-wrapper="true"
      {...props}
    >
      {children}
    </div>
  );
}
