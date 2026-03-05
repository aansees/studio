"use client";
import { useRef, useState, useEffect } from "react";
import { useInView, motion } from "framer-motion";

type FontType = "editorial" | "great-vibes" | "mondwest";

interface WordSegment {
  text: string;
  font?: FontType;
}

type HeroWord = WordSegment[];

interface HeroLineData {
  words: HeroWord[];
  hasScript?: boolean;
}

const currentYear = new Date().getFullYear().toString();

const heroLines: HeroLineData[] = [
  {
    hasScript: true,
    words: [
      [{ text: "W", font: "great-vibes" }, { text: "e" }],
      [{ text: "Design" }],
      [{ text: "&", font: "great-vibes" }],
      [{ text: "Build" }],
    ],
  },
  {
    words: [
      [{ text: "☼", font: "mondwest" }],
      [{ text: "Digital" }],
      [{ text: "Experiences" }],
      [{ text: "✦", font: "mondwest" }],
    ],
  },
  {
    hasScript: true,
    words: [
      [{ text: "T", font: "great-vibes" }, { text: "hat" }],
      [{ text: "M", font: "great-vibes" }, { text: "atter" }],
    ],
  },
  {
    words: [
      [{ text: "Design" }],
      [{ text: "×", font: "mondwest" }],
      [{ text: "Code" }],
      [{ text: "×", font: "mondwest" }],
      [{ text: "Strategy" }],
    ],
  },
  {
    hasScript: true,
    words: [
      [{ text: "S", font: "great-vibes" }, { text: "tudio" }],
      [{ text: "©", font: "mondwest" }],
      [{ text: currentYear }],
      [{ text: "⚗✨", font: "mondwest" }],
    ],
  },
];

const descriptionLines: HeroLineData[] = [
  {
    words: [
      [{ text: "Strategy," }],
      [{ text: "design" }],
      [{ text: "&", font: "great-vibes" }],
      [{ text: "code" }],
      [{ text: "—" }],
      [{ text: "crafting" }],
      [{ text: "digital" }],
    ],
  },
  {
    words: [
      [{ text: "products" }],
      [{ text: "&", font: "great-vibes" }],
      [{ text: "brands" }],
      [{ text: "that" }],
      [{ text: "stand" }],
      [{ text: "out." }],
    ],
  },
  {
    words: [
      [{ text: "No" }],
      [{ text: "nonsense," }],
      [{ text: "always" }],
      [{ text: "cutting" }],
      [{ text: "edge." }],
    ],
  },
];

const fontClassMap: Record<FontType, string> = {
  editorial: "font-editorial",
  "great-vibes": "font-great-vibes",
  mondwest: "font-mondwest",
};

// Pre-compute global word indices for stagger
const heroWordCounts = heroLines.map((l) => l.words.length);
const heroLineStartIndex: number[] = [];
let runningIndex = 0;
for (const count of heroWordCounts) {
  heroLineStartIndex.push(runningIndex);
  runningIndex += count;
}
const heroEndDelay = runningIndex * 0.04 * 0.5;

const descLineStartIndex: number[] = [];
let descRunning = 0;
for (const line of descriptionLines) {
  descLineStartIndex.push(descRunning);
  descRunning += line.words.length;
}

const slideUp = {
  initial: {
    y: "150%",
  },
  open: (i: number) => ({
    y: "0%",
    transition: {
      duration: 0.5,
      delay: 0.04 * i,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  }),
  closed: {
    y: "150%",
    transition: {
      duration: 0.5,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  },
};

const descSlideUp = {
  initial: {
    y: "150%",
  },
  open: (i: number) => ({
    y: "0%",
    transition: {
      duration: 0.4,
      delay: heroEndDelay + 0.015 * i,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  }),
  closed: {
    y: "150%",
    transition: {
      duration: 0.4,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  },
};

function renderWordSegments(segments: WordSegment[]) {
  return segments.map((seg, i) => {
    const fontClass = seg.font ? fontClassMap[seg.font] : "font-editorial";
    return (
      <span key={i} className={fontClass}>
        {seg.text}
      </span>
    );
  });
}

interface HeroProps {
  isLoading?: boolean;
}

const Hero = ({ isLoading = true }: HeroProps) => {
  const container = useRef(null);
  const isInView = useInView(container);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(() => setIsReady(true), 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  const shouldAnimate = isInView && isReady;

  return (
    <section
      className="pt-[140px] pb-[120px] md:pt-[160px] lg:pt-[200px] lg:pb-[150px] xl:pt-[230px] xl:pb-[200px]"
      aria-label="Hero section"
    >
      <div className="main-container">
        <div className="flex flex-col mx-3">
          <div className="w-full flex items-center justify-center text-center flex-col">
            <div
              ref={container}
              className="mt-8 mb-3 flex flex-col items-center -space-y-4 md:-space-y-5 lg:-space-y-7"
            >
              {heroLines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className={`flex justify-center flex-wrap text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium leading-none font-editorial ${
                    line.hasScript ? "gap-x-[0.15em]" : "gap-x-[0.25em]"
                  }`}
                >
                  {line.words.map((word, wordIndex) => {
                    const globalIdx = heroLineStartIndex[lineIndex] + wordIndex;
                    return (
                      <span
                        key={wordIndex}
                        className={`relative overflow-hidden inline-flex ${
                          line.hasScript
                            ? "pb-[0.35em] pt-[0.3em] px-[0.2em]"
                            : "pb-[0.25em] pt-[0.1em]"
                        }`}
                      >
                        <motion.span
                          className="inline-block"
                          variants={slideUp}
                          custom={globalIdx}
                          initial="closed"
                          animate={shouldAnimate ? "open" : "closed"}
                        >
                          {renderWordSegments(word)}
                        </motion.span>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center -space-y-1.5">
              {descriptionLines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className="flex justify-center flex-wrap text-sm md:text-base text-muted-foreground font-editorial leading-relaxed gap-x-[0.3em]"
                >
                  {line.words.map((word, wordIndex) => {
                    const globalIdx = descLineStartIndex[lineIndex] + wordIndex;
                    return (
                      <span
                        key={wordIndex}
                        className="relative overflow-hidden inline-flex pb-[0.2em] pt-[0.1em]"
                      >
                        <motion.span
                          className="inline-block"
                          variants={descSlideUp}
                          custom={globalIdx}
                          initial="closed"
                          animate={shouldAnimate ? "open" : "closed"}
                        >
                          {renderWordSegments(word)}
                        </motion.span>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
