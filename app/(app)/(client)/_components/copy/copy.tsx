"use client";

import { useRef, type PropsWithChildren } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, ScrollTrigger);

type CopyProps = PropsWithChildren<{
  animateOnScroll?: boolean;
  delay?: number;
}>;

export default function Copy({
  children,
  animateOnScroll = true,
  delay = 0,
}: CopyProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const splitRefs = useRef<SplitText[]>([]);
  const lines = useRef<HTMLElement[]>([]);

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
      if (!containerRef.current) {
        return;
      }

      const initializeSplitText = async () => {
        const container = containerRef.current;

        if (!container) {
          return;
        }

        await waitForFonts();

        splitRefs.current = [];
        lines.current = [];

        const elements = Array.from(container.children) as HTMLElement[];
        const targets = elements.length > 0 ? elements : [container];

        targets.forEach((element) => {
          const split = SplitText.create(element as Element, {
            type: "lines",
            mask: "lines",
            linesClass: "line++",
            lineThreshold: 0.1,
          });
          const splitLines = split.lines as HTMLElement[];

          splitRefs.current.push(split);

          const computedStyle = window.getComputedStyle(element);
          const textIndent = computedStyle.textIndent;

          if (textIndent && textIndent !== "0px" && splitLines.length > 0) {
            splitLines[0].style.paddingLeft = textIndent;
            element.style.textIndent = "0";
          }

          lines.current.push(...splitLines);
        });

        gsap.set(lines.current, { y: "100%" });

        const animationProps = {
          y: "0%",
          duration: 1,
          stagger: 0.1,
          ease: "power4.out",
          delay,
        };

        if (animateOnScroll) {
          gsap.to(lines.current, {
            ...animationProps,
            scrollTrigger: {
              trigger: targets[0] ?? container,
              start: "top 90%",
              once: true,
            },
          });
          return;
        }

        gsap.to(lines.current, animationProps);
      };

      void initializeSplitText();

      return () => {
        splitRefs.current.forEach((split) => {
          split.revert();
        });
      };
    },
    { scope: containerRef, dependencies: [animateOnScroll, delay] },
  );

  return (
    <div className="copy-wrapper" ref={containerRef}>
      {children}
    </div>
  );
}
