"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { displayTextClass, monoTextClass } from "../_components/home-config";

gsap.registerPlugin(useGSAP);

type FolderVariant = "variant-1" | "variant-2" | "variant-3";

type WorkItem = {
  index: string;
  name: string;
  href: string;
  variant: FolderVariant;
  images: string[];
};

const variantColors: Record<FolderVariant, { bg: string; fg: string }> = {
  "variant-1": { bg: "var(--otis-accent1)", fg: "var(--otis-fg)" },
  "variant-2": { bg: "var(--otis-accent4)", fg: "var(--otis-bg)" },
  "variant-3": { bg: "var(--otis-accent3)", fg: "var(--otis-fg)" },
};

const rowOffsets = [
  "min-[1001px]:translate-y-[13rem]",
  "min-[1001px]:translate-y-[7.5rem]",
  "min-[1001px]:translate-y-[2rem]",
] as const;

const previewPlacements = [
  { left: "20%", transformOrigin: "top left" },
  { left: "50%", transformOrigin: "center" },
  { left: "80%", transformOrigin: "top right" },
] as const;

function getFolderStyle(variant: FolderVariant): CSSProperties {
  const colors = variantColors[variant];

  return {
    ["--folder-bg" as string]: colors.bg,
    ["--folder-fg" as string]: colors.fg,
    ["--folder-disabled-bg" as string]: "#b8c0c5",
    ["--folder-disabled-fg" as string]: "rgba(20,20,20,0.45)",
  };
}

export default function FeaturedWorkPage() {
  const workPageContainer = useRef<HTMLDivElement | null>(null);

  const workItems = useMemo<WorkItem[]>(
    () => [
      {
        index: "01",
        name: "Citychild",
        href: "/featured-work/orange-room",
        variant: "variant-1",
        images: [
          "/images/work/work_1_1.jpg",
          "/images/work/work_1_2.jpg",
          "/images/work/work_1_3.jpg",
        ],
      },
      {
        index: "02",
        name: "Chrome Saint",
        href: "/featured-work/future-school",
        variant: "variant-2",
        images: [
          "/images/work/work_2_1.jpg",
          "/images/work/work_2_2.jpg",
          "/images/work/work_2_3.jpg",
        ],
      },
      {
        index: "03",
        name: "G-Dream",
        href: "/featured-work/sweetbones",
        variant: "variant-2",
        images: [
          "/images/work/work_3_1.jpg",
          "/images/work/work_3_2.jpg",
          "/images/work/work_3_3.jpg",
        ],
      },
      {
        index: "04",
        name: "Stoneface",
        href: "/featured-work/orange-room",
        variant: "variant-3",
        images: [
          "/images/work/work_4_1.jpg",
          "/images/work/work_4_2.jpg",
          "/images/work/work_4_3.jpg",
        ],
      },
      {
        index: "05",
        name: "Amber Cloak",
        href: "/featured-work/future-school",
        variant: "variant-1",
        images: [
          "/images/work/work_5_1.jpg",
          "/images/work/work_5_2.jpg",
          "/images/work/work_5_3.jpg",
        ],
      },
      {
        index: "06",
        name: "Paper Blade",
        href: "/featured-work/sweetbones",
        variant: "variant-2",
        images: [
          "/images/work/work_6_1.jpg",
          "/images/work/work_6_2.jpg",
          "/images/work/work_6_3.jpg",
        ],
      },
    ],
    [],
  );

  useGSAP(
    () => {
      if (!workPageContainer.current) {
        return;
      }

      const q = gsap.utils.selector(workPageContainer);
      const folders = q(".folder") as HTMLDivElement[];
      const folderWrappers = q(".folder-wrapper") as HTMLDivElement[];

      let isMobile = window.innerWidth < 1000;

      const setInitialPositions = () => {
        gsap.set(folderWrappers, { y: isMobile ? 0 : 25 });
      };

      const mouseEnterHandlers = new Map<Element, () => void>();
      const mouseLeaveHandlers = new Map<Element, () => void>();

      folders.forEach((folder, index) => {
        const previewImages = Array.from(
          folder.querySelectorAll<HTMLElement>(".folder-preview-img"),
        );

        const onEnter = () => {
          if (isMobile) {
            return;
          }

          folders.forEach((siblingFolder) => {
            if (siblingFolder !== folder) {
              siblingFolder.classList.add("disabled");
            }
          });

          gsap.to(folderWrappers[index], {
            y: 0,
            duration: 0.25,
            ease: "back.out(1.7)",
          });

          previewImages.forEach((img, imgIndex) => {
            const rotation =
              imgIndex === 0
                ? gsap.utils.random(-20, -10)
                : imgIndex === 1
                  ? gsap.utils.random(-10, 10)
                  : gsap.utils.random(10, 20);

            gsap.to(img, {
              y: "-100%",
              rotation,
              duration: 0.25,
              ease: "back.out(1.7)",
              delay: imgIndex * 0.025,
            });
          });
        };

        const onLeave = () => {
          if (isMobile) {
            return;
          }

          folders.forEach((siblingFolder) => {
            siblingFolder.classList.remove("disabled");
          });

          gsap.to(folderWrappers[index], {
            y: 25,
            duration: 0.25,
            ease: "back.out(1.7)",
          });

          previewImages.forEach((img, imgIndex) => {
            gsap.to(img, {
              y: "0%",
              rotation: 0,
              duration: 0.25,
              ease: "back.out(1.7)",
              delay: imgIndex * 0.05,
            });
          });
        };

        mouseEnterHandlers.set(folder, onEnter);
        mouseLeaveHandlers.set(folder, onLeave);
        folder.addEventListener("mouseenter", onEnter);
        folder.addEventListener("mouseleave", onLeave);
      });

      const handleResize = () => {
        const nextIsMobile = window.innerWidth < 1000;

        if (nextIsMobile !== isMobile) {
          isMobile = nextIsMobile;
          setInitialPositions();

          folders.forEach((folder) => {
            folder.classList.remove("disabled");
          });

          const allPreviewImages = q(".folder-preview-img") as HTMLElement[];
          gsap.set(allPreviewImages, { y: "0%", rotation: 0 });
        }
      };

      window.addEventListener("resize", handleResize);
      setInitialPositions();

      return () => {
        window.removeEventListener("resize", handleResize);

        folders.forEach((folder) => {
          const onEnter = mouseEnterHandlers.get(folder);
          const onLeave = mouseLeaveHandlers.get(folder);

          if (onEnter) {
            folder.removeEventListener("mouseenter", onEnter);
          }

          if (onLeave) {
            folder.removeEventListener("mouseleave", onLeave);
          }
        });
      };
    },
    { scope: workPageContainer },
  );

  return (
    <main className="relative overflow-hidden bg-[var(--otis-bg)] text-[var(--otis-fg)]">
      <section
        ref={workPageContainer}
        aria-label="Featured work folders"
        className="flex h-[100svh] w-full flex-col justify-end overflow-hidden bg-[var(--otis-bg)] max-[1000px]:h-auto max-[1000px]:justify-start max-[1000px]:py-[15rem]"
      >
        {[0, 1, 2].map((rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className={`relative flex w-full ${rowOffsets[rowIndex]} max-[1000px]:translate-y-0 max-[1000px]:flex-col max-[1000px]:gap-[1.25rem] max-[1000px]:px-[1.25rem]`}
          >
            {workItems.slice(rowIndex * 2, rowIndex * 2 + 2).map((item, itemIndex) => (
              <Link
                key={item.index}
                href={item.href}
                className={`block w-full ${
                  rowIndex === 1 && itemIndex === 0
                    ? "min-[1001px]:flex-[2_1_0%]"
                    : rowIndex === 1 && itemIndex === 1
                      ? "min-[1001px]:flex-[3_1_0%]"
                      : "min-[1001px]:flex-1"
                }`}
              >
                <div
                  className="[&.disabled_.folder-copy]:text-[var(--folder-disabled-fg)] [&.disabled_.folder-index]:bg-[var(--folder-disabled-bg)] [&.disabled_.folder-index-notch]:bg-[var(--folder-disabled-bg)] [&.disabled_.folder-name]:bg-[var(--folder-disabled-bg)] folder group relative flex h-[210px] cursor-pointer flex-col max-[1000px]:h-[200px] max-[1000px]:overflow-hidden max-[1000px]:rounded-[1rem]"
                  style={getFolderStyle(item.variant)}
                >
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-[25rem] max-[1000px]:hidden">
                    {item.images.map((src, imageIndex) => (
                      <div
                        key={`${item.index}-img-${imageIndex}`}
                        className="folder-preview-img absolute top-1/2 h-[12rem] w-[12rem] overflow-hidden rounded-[0.5rem]"
                        style={previewPlacements[imageIndex]}
                      >
                        <Image
                          src={src}
                          alt={`${item.name} preview ${imageIndex + 1}`}
                          fill
                          sizes="192px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="folder-wrapper relative h-full w-full will-change-transform">
                    <div className="folder-index relative w-[40%] rounded-tl-[0.75rem] bg-[var(--folder-bg)] px-[1rem] py-[1rem] transition-colors duration-300 max-[1000px]:w-full max-[1000px]:rounded-t-none max-[1000px]:px-[1.25rem]">
                      <div className="folder-index-notch absolute right-[-0.95rem] top-0 h-[101%] aspect-square bg-[var(--folder-bg)] transition-colors duration-300 [clip-path:polygon(0_0,25%_0,100%_100%,0_100%)] max-[1000px]:hidden" />
                      <p
                        className={`${monoTextClass} folder-copy relative z-[1] leading-none text-[0.8rem] text-[var(--folder-fg)] transition-colors duration-300`}
                      >
                        {item.index}
                      </p>
                    </div>

                    <div className="folder-name flex h-full w-full items-start bg-[var(--folder-bg)] px-[0.25rem] pl-[2rem] pt-0 transition-colors duration-300 max-[1000px]:relative max-[1000px]:justify-center max-[1000px]:rounded-tr-none max-[1000px]:px-[2rem] max-[1000px]:pb-[2rem]">
                      <h1
                        className={`${displayTextClass} folder-copy text-[3rem] tracking-[-0.05rem] text-[var(--folder-fg)] transition-colors duration-300 max-[1000px]:absolute max-[1000px]:left-1/2 max-[1000px]:top-1/2 max-[1000px]:w-full max-[1000px]:-translate-x-1/2 max-[1000px]:-translate-y-1/2 max-[1000px]:text-center max-[1000px]:text-[2rem]`}
                      >
                        {item.name}
                      </h1>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}
