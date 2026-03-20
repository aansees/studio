"use client";

import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import projectEntries from "./data.json";
import {
  displayTextClass,
  monoTextClass,
} from "../../_components/home-config";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ProjectRecord = (typeof projectEntries)[number];

const metaTextClass =
  "font-otis-body text-[clamp(1rem,1.2vw,1.35rem)] font-semibold leading-[1.05]";
const longCopyClass =
  "font-otis-body text-[clamp(1.05rem,1.35vw,1.4rem)] font-semibold leading-[1.08]";

function SymbolBar({ light = false }: { light?: boolean }) {
  const symbolSrc = light
    ? "/images/global/symbols-light.png"
    : "/images/global/symbols.png";

  return (
    <div className="absolute left-0 top-0 z-[2] w-full">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-[2em] py-[1.25rem]">
        <Image
          src={symbolSrc}
          alt=""
          width={96}
          height={16}
          sizes="96px"
          className="h-[1rem] w-auto object-contain"
        />
        <Image
          src={symbolSrc}
          alt=""
          width={96}
          height={16}
          sizes="96px"
          className="h-[1rem] w-auto scale-x-[-1] object-contain"
        />
      </div>
    </div>
  );
}

export function ProjectDetailClient({ project }: { project: ProjectRecord }) {
  const snapshotsSectionRef = useRef<HTMLElement>(null);
  const snapshotsWrapperRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const snapshotsSection = snapshotsSectionRef.current;
      const wrapper = snapshotsWrapperRef.current;
      const progressBar = progressBarRef.current;

      if (!snapshotsSection || !wrapper || !progressBar) {
        return;
      }

      const calculateMoveDistance = () => -(wrapper.scrollWidth - window.innerWidth);
      let moveDistance = calculateMoveDistance();

      if (moveDistance >= 0) {
        gsap.set(progressBar, { width: "100%" });
        return;
      }

      const trigger = ScrollTrigger.create({
        trigger: snapshotsSection,
        start: "top top",
        end: () => `+=${window.innerHeight * 5}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onRefresh: () => {
          moveDistance = calculateMoveDistance();
        },
        onUpdate: (self) => {
          gsap.set(wrapper, {
            x: self.progress * moveDistance,
            force3D: true,
            transformOrigin: "left center",
          });

          gsap.set(progressBar, {
            width: `${self.progress * 100}%`,
          });
        },
      });

      ScrollTrigger.refresh();

      return () => {
        trigger.kill();
      };
    },
    { dependencies: [project.slug], scope: snapshotsSectionRef },
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--otis-bg)] text-[var(--otis-fg)]">
      <div className="relative">
        <section className="relative h-[75svh] w-screen overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col justify-end gap-[1rem] px-[2em] py-[2em]">
            <div className="project-title">
              <h1
                className={`${displayTextClass} text-[clamp(3.75rem,10vw,9rem)]`}
              >
                {project.title}
              </h1>
            </div>

            <div className="h-px w-full border-b border-dashed border-[var(--otis-fg)]/25" />

            <div className="flex gap-[2rem] max-[1000px]:flex-col">
              <div className="flex-1">
                <a
                  href={`https://${project.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${metaTextClass} block`}
                >
                  {project.website}
                </a>
                <p className={metaTextClass}>{project.category}</p>
              </div>

              <div className="flex flex-1 gap-[2rem] max-[1000px]:flex-col">
                <div className="flex-1">
                  <p className={metaTextClass}>{project.date}</p>
                  <p className={metaTextClass}>{project.roles.join(", ")}</p>
                </div>

                <div className="flex-1">
                  <p className={metaTextClass}>Client</p>
                  <p className={metaTextClass}>{project.client}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="my-[2rem] w-full">
        <div className="mx-auto w-full max-w-[1600px] px-[2em]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[1.5rem] border border-dashed border-[var(--otis-fg)]/25 max-[1000px]:aspect-[4/5]">
            <Image
              src={project.bannerImage}
              alt={`${project.title} banner`}
              fill
              sizes="(max-width: 1000px) 100vw, 1600px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="w-screen overflow-hidden px-[2em] pb-[6rem] pt-[2rem]">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-[2rem] max-[1000px]:grid-cols-1">
          <div className="max-[1000px]:hidden" />

          <div className="flex flex-col gap-[4rem]">
            <div>
              <p className={monoTextClass}>
                <span className="mr-[0.35rem]">&#9654;</span>
                Stack
              </p>
              <div className="mt-[1rem] space-y-[0.2rem]">
                {project.stack.map((item) => (
                  <p key={item} className={metaTextClass}>
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="w-[75%] max-[1000px]:w-full">
              <p className={monoTextClass}>
                <span className="mr-[0.35rem]">&#9654;</span>
                Background
              </p>
              <p className={`${longCopyClass} mt-[1rem]`}>{project.background}</p>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={snapshotsSectionRef}
        className="relative h-[100svh] w-screen overflow-hidden bg-[var(--otis-fg)] text-[var(--otis-bg)]"
      >
        <SymbolBar light />

        <div className="absolute bottom-0 left-0 z-[2] w-full">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-[1rem] px-[2em] py-[1.25rem] max-[700px]:flex-col max-[700px]:items-start">
            <p className={monoTextClass}>
              <span className="mr-[0.35rem]">&#9654;</span>
              {project.snapshotsLabel}
            </p>
            <p className={monoTextClass}>{project.snapshotsSubLabel}</p>
          </div>
        </div>

        <div
          ref={snapshotsWrapperRef}
          className="relative flex h-[100svh] will-change-transform"
          style={{ width: `${project.snapshots.length * 100}vw` }}
        >
          {project.snapshots.map((image, index) => (
            <div
              key={`${project.slug}-snapshot-${index + 1}`}
              className="flex h-[100svh] w-screen shrink-0 items-center justify-center px-[2em]"
            >
              <div className="relative aspect-[16/9] w-[65%] overflow-hidden rounded-[0.75rem] border border-dashed border-[var(--otis-bg)]/30 max-[1000px]:w-full">
                <Image
                  src={image}
                  alt={`${project.title} snapshot ${index + 1}`}
                  fill
                  sizes="(max-width: 1000px) calc(100vw - 4rem), 65vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-[2rem] left-1/2 z-[3] flex h-[1rem] w-[20%] min-w-[300px] -translate-x-1/2 items-center justify-between max-[1000px]:bottom-[5rem] max-[1000px]:w-[calc(100%-4rem)]">
          {Array.from({ length: 30 }, (_, index) => (
            <div
              key={`progress-indicator-${index + 1}`}
              className="h-1/2 w-px bg-[var(--otis-bg)]/35"
            />
          ))}
          <div
            ref={progressBarRef}
            className="absolute left-0 top-0 h-full w-0 border border-[var(--otis-bg)] bg-transparent"
          />
        </div>
      </section>

      <section className="w-screen overflow-hidden px-[2em] pb-[10rem] pt-[8rem]">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-[2rem] max-[1000px]:grid-cols-1">
          <div className="max-[1000px]:hidden" />

          <div className="w-[75%] max-[1000px]:w-full">
            <p className={monoTextClass}>
              <span className="mr-[0.35rem]">&#9654;</span>
              Client Review
            </p>

            <div className="mt-[1rem] space-y-[1.5rem]">
              {project.review.map((paragraph) => (
                <p key={paragraph} className={longCopyClass}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
