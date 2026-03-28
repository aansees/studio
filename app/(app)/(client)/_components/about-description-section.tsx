"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const aboutParagraphs = [
  "ANCS Studio is built for brands that need more than a clean launch. We create modern websites and digital experiences where story leads, performance follows, and every detail earns its place.",
  "From custom software to immersive 3D and GSAP-led motion, our work turns complex ideas into premium products that feel refined on screen and reliable in every interaction.",
];

const keywordToneByWord: Record<string, string> = {
  immersive: "var(--otis-accent1)",
  story: "var(--otis-accent1)",
  detail: "var(--otis-accent1)",
  brands: "var(--otis-accent2)",
  refined: "var(--otis-accent2)",
  "complex": "var(--otis-accent2)",
  create: "var(--otis-accent3)",
  "performance": "var(--otis-accent3)",
  interaction: "var(--otis-accent3)",
};

const paragraphClass =
  "font-otis-display text-[clamp(1.42rem,2.15vw,2.15rem)] leading-[1.08] tracking-[-0.02em] text-[var(--otis-fg)]";
const wordClass =
  "mb-[0.2rem] mr-[0.3rem] inline-block rounded-[0.5rem] px-[0.18rem] py-[0.08rem] align-top opacity-0 will-change-[background-color,opacity] max-[1000px]:mb-[0.15rem] max-[1000px]:mr-[0.16rem] max-[1000px]:px-[0.125rem] max-[1000px]:py-[0.05rem]";
const keywordFrameClass =
  "pointer-events-none absolute inset-0 -z-10 rounded-[0.65rem] border border-dashed border-[var(--otis-fg)]";
const tagClass =
  "tag pointer-events-none absolute z-[2] w-max rounded-[0.5em] bg-[var(--otis-fg)]";
const tagCopyClass =
  "font-otis-mono px-[0.5em] pb-[0.5em] pt-[0.75em] text-[1rem] uppercase leading-none text-[var(--otis-bg)]";

function normalizeWord(word: string) {
  return word.toLowerCase().replace(/[.,!?;:"]/g, "");
}

function renderWord(word: string, key: string, keywordTone?: string) {
  return (
    <span key={key} data-anime-word className={wordClass}>
      <span className="relative inline-flex">
        {keywordTone ? (
          <span
            aria-hidden="true"
            className={keywordFrameClass}
            style={{
              backgroundColor: keywordTone,
              inset: "-0.05rem -0.45rem",
            }}
          />
        ) : null}
        <span data-anime-word-text className="relative opacity-0">
          {word}
        </span>
      </span>
    </span>
  );
}

export function AboutDescriptionSection() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;

      if (!root) {
        return;
      }

      const words = Array.from(
        root.querySelectorAll<HTMLElement>("[data-anime-word]"),
      );

      if (words.length === 0) {
        return;
      }

      const wordHighlightBgColor = "191, 188, 180";

      const updateWords = (progress: number) => {
        const totalWords = words.length;

        words.forEach((word, index) => {
          const wordText = word.querySelector<HTMLElement>("[data-anime-word-text]");

          if (!wordText) {
            return;
          }

          if (progress <= 0.7) {
            const revealProgress = Math.min(1, progress / 0.7);
            const overlapWords = 15;
            const totalAnimationLength = 1 + overlapWords / totalWords;
            const wordStart = index / totalWords;
            const wordEnd = wordStart + overlapWords / totalWords;
            const timelineScale =
              1 /
              Math.min(
                totalAnimationLength,
                1 + (totalWords - 1) / totalWords + overlapWords / totalWords,
              );
            const adjustedStart = wordStart * timelineScale;
            const adjustedEnd = wordEnd * timelineScale;
            const duration = adjustedEnd - adjustedStart;
            const wordProgress =
              revealProgress <= adjustedStart
                ? 0
                : revealProgress >= adjustedEnd
                  ? 1
                  : (revealProgress - adjustedStart) / duration;
            const backgroundFadeStart =
              wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0;
            const backgroundOpacity = Math.max(0, 1 - backgroundFadeStart);
            const textRevealProgress =
              wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0;

            word.style.opacity = `${wordProgress}`;
            word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${backgroundOpacity})`;
            wordText.style.opacity = `${Math.pow(textRevealProgress, 0.5)}`;
            return;
          }

          const reverseProgress = (progress - 0.7) / 0.3;
          const reverseOverlapWords = 5;
          const reverseWordStart = index / totalWords;
          const reverseWordEnd =
            reverseWordStart + reverseOverlapWords / totalWords;
          const reverseTimelineScale =
            1 /
            Math.max(
              1,
              (totalWords - 1) / totalWords +
                reverseOverlapWords / totalWords,
            );
          const reverseAdjustedStart = reverseWordStart * reverseTimelineScale;
          const reverseAdjustedEnd = reverseWordEnd * reverseTimelineScale;
          const reverseDuration = reverseAdjustedEnd - reverseAdjustedStart;
          const reverseWordProgress =
            reverseProgress <= reverseAdjustedStart
              ? 0
              : reverseProgress >= reverseAdjustedEnd
                ? 1
                : (reverseProgress - reverseAdjustedStart) / reverseDuration;

          word.style.opacity = "1";

          if (reverseWordProgress > 0) {
            wordText.style.opacity = `${1 - reverseWordProgress}`;
            word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${reverseWordProgress})`;
            return;
          }

          wordText.style.opacity = "1";
          word.style.backgroundColor = `rgba(${wordHighlightBgColor}, 0)`;
        });
      };

      updateWords(0);

      const trigger = ScrollTrigger.create({
        trigger: root,
        pin: true,
        start: "top top",
        end: () => `+=${window.innerHeight * (window.innerWidth < 1000 ? 3 : 4)}`,
        pinSpacing: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          updateWords(self.progress);
        },
      });

      const tagTriggers: ScrollTrigger[] = [];

      if (window.innerWidth > 1000) {
        const tagAnimations = [
          { selector: "#tag-1", y: -300, rotation: -45 },
          { selector: "#tag-2", y: -150, rotation: 70 },
          { selector: "#tag-3", y: -400, rotation: 120 },
          { selector: "#tag-4", y: -350, rotation: -60 },
          { selector: "#tag-5", y: -200, rotation: 100 },
        ];

        tagAnimations.forEach(({ selector, y, rotation }) => {
          const element = root.querySelector<HTMLElement>(selector);

          if (!element) {
            return;
          }

          const animation = gsap.to(element, {
            y,
            rotation,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom+=100% top",
              scrub: 1,
            },
          });

          if (animation.scrollTrigger) {
            tagTriggers.push(animation.scrollTrigger);
          }
        });
      }

      ScrollTrigger.refresh();

      return () => {
        tagTriggers.forEach((instance) => {
          instance.kill();
        });
        trigger.kill();
      };
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="relative h-[100svh] w-screen overflow-hidden bg-[var(--otis-bg)] text-[var(--otis-fg)]"
    >
      <div className="absolute inset-0 flex flex-col">
        <div className="relative z-[1] flex flex-1 items-center justify-center px-[2em] py-[4rem]">
          <div className="mx-auto flex w-full max-w-[980px] flex-col items-center text-center">
            <h2 className="sr-only">About description</h2>

            <div className="space-y-[3.5rem] max-[1000px]:space-y-[2.5rem]">
              {aboutParagraphs.map((paragraph, paragraphIndex) => {
                const words = paragraph.split(/\s+/);
                let previousWordWasKeyword = false;

                return (
                  <p key={paragraph} className={paragraphClass}>
                    {words.map((word, wordIndex) => {
                      const requestedTone = keywordToneByWord[normalizeWord(word)];
                      const keywordTone =
                        requestedTone && !previousWordWasKeyword
                          ? requestedTone
                          : undefined;

                      previousWordWasKeyword = Boolean(requestedTone);

                      return renderWord(
                        word,
                        `p-${paragraphIndex}-w-${wordIndex}`,
                        keywordTone,
                      );
                    })}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        <div
          id="tag-1"
          className={`${tagClass} left-[25%] top-[50%] hidden -translate-x-1/2 -translate-y-1/2 rotate-[20deg] min-[1001px]:block`}
        >
          <p className={tagCopyClass}>Interactive</p>
        </div>
        <div
          id="tag-2"
          className={`${tagClass} left-[10%] top-[65%] hidden -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] min-[1001px]:block`}
        >
          <p className={tagCopyClass}>Joyful</p>
        </div>
        <div
          id="tag-3"
          className={`${tagClass} left-[75%] top-[50%] hidden -translate-x-1/2 -translate-y-1/2 rotate-[5deg] min-[1001px]:block`}
        >
          <p className={tagCopyClass}>Precise</p>
        </div>
        <div
          id="tag-4"
          className={`${tagClass} left-[50%] top-[75%] hidden -translate-x-1/2 -translate-y-1/2 rotate-[45deg] min-[1001px]:block`}
        >
          <p className={tagCopyClass}>Curious</p>
        </div>
        <div
          id="tag-5"
          className={`${tagClass} left-[80%] top-[100%] hidden -translate-x-1/2 -translate-y-1/2 rotate-[-60deg] min-[1001px]:block`}
        >
          <p className={tagCopyClass}>Personality</p>
        </div>
      </div>
    </section>
  );
}
