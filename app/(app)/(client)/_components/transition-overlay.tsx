/* eslint-disable @next/next/no-img-element */

import {
  displayTextClass,
  monoTextClass,
  preloaderImagePaths,
  preloaderTextLines,
} from "./home-config";

const preloaderCardClasses =
  "relative aspect-[5/7] w-[10vw] overflow-hidden opacity-0 will-change-[transform,clip-path,opacity] max-[1000px]:w-[20vw]";

export function TransitionOverlay() {
  return (
    <div
      aria-hidden="true"
      data-preloader-root
      className="fixed inset-0 z-[100000] overflow-hidden"
    >
      <div
        data-preloader-panel
        className="absolute inset-0 bg-[var(--otis-fg)] text-[var(--otis-bg)] [clip-path:polygon(0_0,100%_0,100%_100%,0%_100%)]"
      >
        <div className="absolute left-[2em] top-[2em] h-[1.25rem] overflow-hidden max-[1000px]:left-[1em] max-[1000px]:top-[1em]">
          <div
            data-preloader-copy-track
            className="flex flex-col will-change-transform"
          >
            {preloaderTextLines.map((line) => (
              <p
                key={line}
                className={`${monoTextClass} flex h-[1.25rem] items-center text-[var(--otis-bg)]`}
              >
                {line}
              </p>
            ))}
            <p
              aria-hidden="true"
              className={`${monoTextClass} flex h-[1.25rem] items-center text-[var(--otis-bg)]`}
            >
              &nbsp;
            </p>
          </div>
        </div>

        <div
          data-preloader-gallery
          className="absolute left-1/2 top-1/2 flex w-full max-w-[calc(100vw-4em)] -translate-x-1/2 -translate-y-1/2 justify-center gap-[10vw] px-[2em] will-change-[gap] max-[1000px]:max-w-[calc(100vw-1em)] max-[1000px]:gap-[2.5vw] max-[1000px]:px-[0.5em]"
        >
          {preloaderImagePaths.slice(0, 2).map((path) => (
            <div
              key={path}
              data-preloader-image
              className={preloaderCardClasses}
            >
              <img
                src={path}
                alt=""
                loading="eager"
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </div>
          ))}

          <div
            data-preloader-center-slot
            className={`${preloaderCardClasses} pointer-events-none opacity-0`}
          />

          {preloaderImagePaths.slice(2).map((path) => (
            <div
              key={path}
              data-preloader-image
              className={preloaderCardClasses}
            >
              <img
                src={path}
                alt=""
                loading="eager"
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="absolute bottom-[2em] right-[2em] max-[1000px]:bottom-[1em] max-[1000px]:right-[1em]">
          <h1
            data-preloader-counter
            className={`${displayTextClass} text-[clamp(3rem,6vw,5rem)] leading-none`}
          >
            0
          </h1>
        </div>
      </div>
    </div>
  );
}
