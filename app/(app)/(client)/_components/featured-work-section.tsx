/* eslint-disable @next/next/no-img-element */

import {
  displayTextClass,
  featuredTitles,
  heroImagePaths,
  monoTextClass,
  type InternalLinkHandler,
} from "./home-config";

type FeaturedWorkSectionProps = {
  onInternalLinkClick: InternalLinkHandler;
};

export function FeaturedWorkSection({
  onInternalLinkClick,
}: FeaturedWorkSectionProps) {
  return (
    <section
      id="featured-work"
      data-featured-section
      className="relative h-[100svh] w-screen overflow-hidden max-[1000px]:h-auto max-[1000px]:py-[4em]"
    >
      <div className="absolute left-1/2 top-1/2 hidden h-[200vh] w-[200vw] -translate-x-1/2 -translate-y-1/2 [perspective:500px] [transform-style:preserve-3d] min-[1001px]:block">
        {heroImagePaths.map((path, index) => (
          <div
            key={path}
            data-featured-image-card
            className="absolute h-[300px] w-[300px] overflow-hidden rounded-[2em]"
          >
            <img
              src={path}
              alt={`Featured work image ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      <div
        data-featured-titles
        className="relative flex h-screen w-[500vw] will-change-transform max-[1000px]:h-auto max-[1000px]:w-screen max-[1000px]:flex-col max-[1000px]:gap-[2em]"
      >
        {featuredTitles.map((item, index) => (
          <div
            key={item.title}
            className={`flex flex-1 flex-col items-center justify-center max-[1000px]:gap-[1em] ${
              index === 0 ? "max-[1000px]:mb-[2em]" : ""
            }`}
          >
            {item.image ? (
              <div className="relative top-0 hidden h-[150px] w-[calc(100%-4em)] overflow-hidden rounded-[1em] border-[0.2em] border-[var(--otis-fg)] max-[1000px]:block">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <h1
              className={`${displayTextClass} translate-y-[-0.5em] text-center text-[clamp(3rem,7vw,6rem)] max-[1000px]:w-[75%] max-[1000px]:translate-y-0`}
            >
              {item.title}
            </h1>
          </div>
        ))}
      </div>

      <div className="absolute right-[2em] top-1/2 z-10 hidden w-[2rem] -translate-y-1/2 flex-col items-center justify-center gap-[0.35rem] rounded-[40px] bg-[var(--otis-fg)] px-[0.65rem] py-[1.25rem] text-[var(--otis-bg)] min-[1001px]:flex">
        {Array.from({ length: 5 }, (_, sectionIndex) => (
          <div
            key={`indicator-section-${sectionIndex + 1}`}
            className="flex w-full flex-col items-center gap-[0.35rem]"
          >
            <p className={monoTextClass}>{`0${sectionIndex + 1}`}</p>
            {Array.from({ length: 10 }, (_, indicatorIndex) => (
              <div
                key={`indicator-${sectionIndex + 1}-${indicatorIndex + 1}`}
                data-featured-indicator
                className="h-[1.5px] w-full bg-[var(--otis-bg)] opacity-20"
              />
            ))}
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 z-[2] flex w-full items-center justify-between p-[2em] max-[1000px]:relative max-[1000px]:mt-[4em] max-[1000px]:justify-center">
        <p className={`${monoTextClass} max-[1000px]:hidden`}>Visual Vault [ 10 ]</p>
        <p className={`${monoTextClass} max-[1000px]:hidden`}>
          {"///////////////////"}
        </p>
        <a
          href="#featured-work"
          onClick={(event) => onInternalLinkClick(event, "featured-work")}
          className={monoTextClass}
        >
          Browse Full Bizarre
        </a>
      </div>
    </section>
  );
}
