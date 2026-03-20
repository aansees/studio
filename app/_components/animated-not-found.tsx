"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  bodyTextClass,
  displayTextClass,
  monoTextClass,
} from "../(app)/(client)/_components/home-config";

gsap.registerPlugin(ScrollTrigger, SplitText);

const previewColumns = [
  [
    "/images/work-items/work-item-8.jpg",
    "/images/work-items/work-item-2.jpg",
    "/images/work-items/work-item-3.jpg",
  ],
  [
    "/images/work-items/work-item-4.jpg",
    "/images/work-items/work-item-5.jpg",
    "/images/work-items/work-item-6.jpg",
  ],
  [
    "/images/work-items/work-item-7.jpg",
    "/images/work-items/work-item-1.jpg",
    "/images/work-items/work-item-9.jpg",
  ],
  [
    "/images/work-items/work-item-10.jpg",
    "/images/work-items/work-item-8.jpg",
    "/images/work-items/work-item-2.jpg",
  ],
  [
    "/images/work-items/work-item-3.jpg",
    "/images/work-items/work-item-4.jpg",
    "/images/work-items/work-item-5.jpg",
  ],
];

const snapshotImages = [
  "/images/work-items/work-item-6.jpg",
  "/images/work-items/work-item-8.jpg",
  "/images/work-items/work-item-10.jpg",
];

type AnimatedNotFoundProps = {
  slugLabel?: string;
};

export function AnimatedNotFound({ slugLabel }: AnimatedNotFoundProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;

      if (!root) {
        return;
      }

      const heroTitle = root.querySelector<HTMLElement>("[data-room-title]");
      const heroTagItems = gsap.utils.toArray<HTMLElement>("[data-room-tag]", root);
      const heroDescription = root.querySelector<HTMLElement>(
        "[data-room-description]",
      );
      const heroSymbols = gsap.utils.toArray<HTMLElement>("[data-room-symbol]", root);
      const previewWrapper = root.querySelector<HTMLElement>(
        "[data-room-preview-wrapper]",
      );
      const previewWhitespace = root.querySelector<HTMLElement>(
        "[data-room-whitespace]",
      );
      const previewSideCols = gsap.utils.toArray<HTMLElement>(
        "[data-room-preview-side-col]",
        root,
      );
      const mainPreviewImage = root.querySelector<HTMLElement>(
        "[data-room-main-preview-image]",
      );

      const titleSplit = heroTitle
        ? new SplitText(heroTitle, {
            type: "lines",
            mask: "lines",
          })
        : null;
      const tagSplits = heroTagItems.map(
        (item) =>
          new SplitText(item, {
            type: "lines",
            mask: "lines",
          }),
      );
      const descriptionSplit = heroDescription
        ? new SplitText(heroDescription, {
            type: "lines",
            mask: "lines",
          })
        : null;

      const animatedLines = [
        ...(titleSplit?.lines ?? []),
        ...tagSplits.flatMap((split) => split.lines),
        ...(descriptionSplit?.lines ?? []),
      ].map((line) => line as HTMLElement);

      gsap.set(animatedLines, {
        y: "120%",
        position: "relative",
        willChange: "transform",
      });

      gsap.set(heroSymbols, {
        scale: 0,
        willChange: "transform",
        transformOrigin: "center center",
      });

      const heroTl = gsap.timeline({ delay: 0.2 });

      if (titleSplit) {
        heroTl.to(titleSplit.lines, {
          y: "0%",
          duration: 1,
          ease: "power4.out",
        });
      }

      heroTl.to(
        heroSymbols,
        {
          scale: 1,
          duration: 1,
          ease: "power4.out",
          stagger: 0.08,
        },
        "-=1",
      );

      heroTl.to(
        tagSplits.flatMap((split) => split.lines),
        {
          y: "0%",
          duration: 1,
          ease: "power4.out",
          stagger: 0.1,
        },
        "-=0.9",
      );

      if (descriptionSplit) {
        heroTl.to(
          descriptionSplit.lines,
          {
            y: "0%",
            duration: 1,
            ease: "power4.out",
            stagger: 0.08,
          },
          "-=0.9",
        );
      }

      let previewTrigger: ScrollTrigger | null = null;

      if (previewWrapper && previewWhitespace && mainPreviewImage) {
        gsap.set(previewWrapper, {
          xPercent: -50,
          yPercent: -50,
          scale: 1,
          transformOrigin: "center center",
          willChange: "transform",
        });

        gsap.set(previewSideCols, {
          y: 0,
          willChange: "transform",
        });

        gsap.set(mainPreviewImage, {
          scale: 2,
          transformOrigin: "center center",
          willChange: "transform",
        });

        previewTrigger = ScrollTrigger.create({
          trigger: previewWhitespace,
          start: "top bottom",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            const previewMaxScale = window.innerWidth < 900 ? 4 : 2.65;
            const scale = 1 + self.progress * previewMaxScale;
            const yPreviewColTranslate = self.progress * 300;
            const mainPreviewImageScale = 2 - self.progress * 0.85;

            gsap.set(previewWrapper, {
              xPercent: -50,
              yPercent: -50,
              scale,
            });

            previewSideCols.forEach((previewCol) => {
              gsap.set(previewCol, {
                y: yPreviewColTranslate,
              });
            });

            gsap.set(mainPreviewImage, {
              scale: mainPreviewImageScale,
            });
          },
        });
      }

      return () => {
        previewTrigger?.kill();
        titleSplit?.revert();
        tagSplits.forEach((split) => split.revert());
        descriptionSplit?.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <main
      ref={rootRef}
      className="[--otis-accent1:#ed6a5a] [--otis-accent2:#f4f1bb] [--otis-accent3:#9bc1bc] [--otis-accent4:#5d576b] [--otis-bg:#edf1e8] [--otis-bg2:#d7dbd2] [--otis-fg:#141414] text-[var(--otis-fg)]"
    >
      <section
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden bg-[#141414]"
      >
        <div
          data-room-preview-wrapper
          className="absolute left-1/2 top-1/2 flex h-screen w-[160vw] gap-[4em] will-change-transform max-[1000px]:w-[250vw]"
        >
          {previewColumns.map((column, columnIndex) => (
            <div
              key={`preview-column-${columnIndex + 1}`}
              data-room-preview-side-col={columnIndex === 2 ? undefined : ""}
              className={`flex flex-1 flex-col gap-[4em] ${
                columnIndex === 2 ? "justify-center" : ""
              }`}
            >
              {column.map((imagePath, imageIndex) => {
                const isMainPreview = columnIndex === 2 && imageIndex === 1;

                return (
                  <div
                    key={`${imagePath}-${imageIndex}`}
                    className="flex-1 overflow-hidden rounded-[1em]"
                  >
                    <img
                      src={imagePath}
                      alt=""
                      className={`h-full w-full object-cover ${
                        isMainPreview ? "scale-[2]" : ""
                      }`}
                      data-room-main-preview-image={isMainPreview ? "" : undefined}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <div className="relative z-10">
        <section className="relative flex h-[100svh] w-screen flex-col items-center justify-center gap-[4rem] overflow-hidden bg-[#edf1e8] px-[2em] pt-[5rem] text-[var(--otis-fg)]">
          <div className="flex flex-col gap-[2em]">
            <div className="flex items-center justify-center gap-[1.25em] max-[1000px]:gap-[0.75em]">
              <img
                data-room-symbol
                src="/images/global/s6-dark.png"
                alt=""
                className="h-[1rem] w-[1rem] object-contain"
              />
              <div className="overflow-hidden">
                <h1
                  data-room-title
                  className={`${displayTextClass} text-center text-[clamp(4rem,10vw,9rem)] text-[var(--otis-fg)]`}
                >
                  Room 404
                </h1>
              </div>
              <img
                data-room-symbol
                src="/images/global/s6-dark.png"
                alt=""
                className="h-[1rem] w-[1rem] object-contain"
              />
            </div>

            <div className="flex justify-center gap-[1em] max-[1000px]:flex-wrap">
              {["Lost Transmission", "//", "Conceptual UI"].map((tag) => (
                <div key={tag} className="overflow-hidden">
                  <p data-room-tag className={`${monoTextClass} text-[var(--otis-fg)]`}>
                    {tag}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-[min(52rem,60vw)] text-center max-[1000px]:w-full">
            <div className="overflow-hidden">
              <p
                data-room-description
                className={`${bodyTextClass} mx-auto max-w-[48rem] text-[clamp(1.125rem,2.1vw,1.85rem)] font-medium leading-[1.2] text-[var(--otis-fg)]`}
              >
                {slugLabel
                  ? `The route for ${slugLabel} drifted somewhere between a forgotten login screen and a cosmic hallway. The signal is gone, but the vibe is still immaculate.`
                  : "The page you were looking for drifted somewhere between a forgotten login screen and a cosmic hallway. The signal is gone, but the vibe is still immaculate."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-[0.75rem]">
            <Link
              href="/featured-work"
              className={`${monoTextClass} rounded-[0.5em] bg-[var(--otis-bg)] px-[0.85em] py-[0.65em] text-[var(--otis-fg)]`}
            >
              Featured Work
            </Link>
            <Link
              href="/"
              className={`${monoTextClass} rounded-[0.5em] border border-dashed border-[var(--otis-bg)]/35 px-[0.85em] py-[0.65em] text-[var(--otis-fg)]`}
            >
              Go Home
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-[2em] text-[var(--otis-fg)] max-[1000px]:flex-col max-[1000px]:items-center max-[1000px]:gap-[1em]">
            <div className="flex items-center gap-[0.75em] max-[1000px]:hidden">
              <img
                src="/images/global/symbols-light.png"
                alt=""
                className="h-[1rem] w-auto object-contain"
              />
            </div>

            <p
              className={`${monoTextClass} absolute left-1/2 -translate-x-1/2 max-[1000px]:static max-[1000px]:translate-x-0`}
            >
              Scroll Down
            </p>

            <p className={monoTextClass}>Error 0404</p>
          </div>
        </section>

        <section
          data-room-whitespace
          className="relative h-[600svh] w-screen bg-transparent"
        />

        <section className="relative w-screen bg-[var(--otis-bg)] px-[2em] py-[8em] text-[var(--otis-fg)]">
          <div className="mx-auto flex max-w-[90rem] flex-col items-center gap-[3em] text-center">
            <h2 className={`${displayTextClass} text-[clamp(3rem,7vw,6rem)]`}>
              What The Browser Said
            </h2>

            <div className="max-w-[65rem]">
              <p
                className={`${bodyTextClass} text-[clamp(1.5rem,3vw,2.5rem)] font-medium leading-[1.12]`}
              >
                &quot;We came in expecting a page and left with a portal. The route
                disappeared, the imagery kept escalating, and somehow the empty
                state still felt intentional.&quot;
              </p>
            </div>

            <div className="flex flex-col items-center gap-[1.5em]">
              <div className="h-[100px] w-[100px] overflow-hidden rounded-[1em] border-[0.2em] border-[var(--otis-bg)] outline outline-[0.2em] outline-[var(--otis-accent1)]">
                <img
                  src="/images/project/client-portrait.jpg"
                  alt="Recovered client portrait"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-[0.25em] text-center">
                <p className={bodyTextClass}>Juno Merrick</p>
                <p className={monoTextClass}>Director, WOW Studio</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex w-screen flex-col gap-[2em] bg-[var(--otis-bg)] px-[2em] pb-[4em]">
          {snapshotImages.map((imagePath, index) => (
            <div
              key={imagePath}
              className="aspect-[16/9] overflow-hidden rounded-[2em] max-[1000px]:aspect-[5/7]"
            >
              <img
                src={imagePath}
                alt={`404 snapshot ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
