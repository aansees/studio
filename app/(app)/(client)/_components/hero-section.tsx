/* eslint-disable @next/next/no-img-element */

import type { RefObject } from "react";
import { displayTextClass, monoTextClass } from "./home-config";

type HeroSectionProps = {
  heroImageRef: RefObject<HTMLImageElement | null>;
};

export function HeroSection({ heroImageRef }: HeroSectionProps) {
  return (
    <>
      <section
        id="top"
        className="relative flex h-[100svh] w-screen flex-col items-center justify-center overflow-x-hidden p-[2em]"
      >
        <div className="relative">
          <div className="relative -translate-x-[20%]">
            <h1
              data-preloader-title
              className={`${displayTextClass} text-[20vw] leading-[0.9]`}
            >
              Otis
            </h1>
          </div>
          <div className="relative z-[2] translate-x-[20%]">
            <h1
              data-preloader-title
              className={`${displayTextClass} text-[20vw] leading-[0.9]`}
            >
              Studio
            </h1>
          </div>
        </div>

        <div className="absolute bottom-0 flex w-full justify-between p-[2em] max-[1000px]:justify-end">
          <div className="h-[1rem] max-[1000px]:hidden">
            <img
              src="/images/global/symbols.png"
              alt=""
              className="h-full w-auto object-contain"
            />
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 max-[1000px]:left-[2em] max-[1000px]:translate-x-0">
            <p className={monoTextClass}>Pixels by Otis / 2025</p>
          </div>

          <div>
            <p className={monoTextClass}>Portfolio Mode: ON</p>
          </div>
        </div>
      </section>

      <section data-hero-holder className="relative h-[100svh] w-screen p-[2em]">
        <div
          data-hero-frame
          className="relative h-full w-full overflow-hidden rounded-[2em] border-[0.3em] border-[var(--otis-fg)]"
        >
          <img
            ref={heroImageRef}
            src="/images/hero/img1.jpg"
            alt="Featured project montage"
            className="h-full w-full object-cover"
          />
        </div>
      </section>
    </>
  );
}
