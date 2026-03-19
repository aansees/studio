/* eslint-disable @next/next/no-img-element */

import type { RefObject } from "react";
import {
  bodyTextClass,
  displayTextClass,
  footerColumns,
  monoTextClass,
  type InternalLinkHandler,
} from "./home-config";

type HomeFooterProps = {
  footerRef: RefObject<HTMLElement | null>;
  explosionContainerRef: RefObject<HTMLDivElement | null>;
  onInternalLinkClick: InternalLinkHandler;
};

export function HomeFooter({
  footerRef,
  explosionContainerRef,
  onInternalLinkClick,
}: HomeFooterProps) {
  return (
    <footer
      ref={footerRef}
      className="relative flex h-[85svh] w-screen flex-col items-center justify-between overflow-hidden p-[2em] text-[var(--otis-bg)] max-[1000px]:h-[100svh]"
    >
      <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2em] bg-[var(--otis-fg)] p-[2em]">
        <div className="absolute left-0 top-0 flex w-full justify-between p-[2em]">
          <img
            src="/images/global/s6.png"
            alt=""
            className="h-[1rem] w-auto object-contain"
          />
          <img
            src="/images/global/s6.png"
            alt=""
            className="h-[1rem] w-auto object-contain"
          />
        </div>

        <div className="absolute bottom-0 left-0 flex w-full justify-between p-[2em]">
          <img
            src="/images/global/s6.png"
            alt=""
            className="h-[1rem] w-auto object-contain"
          />
          <img
            src="/images/global/s6.png"
            alt=""
            className="h-[1rem] w-auto object-contain"
          />
        </div>

        <div className="relative text-center">
          <h1 className={`${displayTextClass} text-[clamp(3rem,8vw,7rem)]`}>
            Otis Valen
          </h1>
        </div>

        <div className="mb-[8em] flex gap-[2em] max-[1000px]:mb-[2em] max-[1000px]:flex-col">
          {footerColumns.map((column, columnIndex) => (
            <div
              key={column.title}
              className={`flex flex-1 flex-col items-center gap-[1em] ${
                columnIndex === 1 || columnIndex === 3 ? "max-[1000px]:hidden" : ""
              }`}
            >
              <p className={bodyTextClass}>{column.title}</p>

              {column.items.map((item) => {
                if ("href" in item && item.href) {
                  return (
                    <a
                      key={`${column.title}-${item.label}`}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`${bodyTextClass} opacity-[0.35]`}
                    >
                      {item.label}
                    </a>
                  );
                }

                if ("target" in item && item.target) {
                  const target = item.target;

                  return (
                    <a
                      key={`${column.title}-${item.label}`}
                      href={`#${target}`}
                      onClick={(event) => onInternalLinkClick(event, target)}
                      className={`${bodyTextClass} opacity-[0.35]`}
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <p
                    key={`${column.title}-${item.label}`}
                    className={`${bodyTextClass} opacity-[0.35]`}
                  >
                    {item.label}
                  </p>
                );
              })}
            </div>
          ))}
        </div>

        <div className="relative flex w-full justify-center gap-[2em] max-[1000px]:flex-col max-[1000px]:gap-[0.5em] max-[1000px]:text-center">
          <p className={monoTextClass}>MWT - MAY 2025</p>
          <p className={`${monoTextClass} max-[1000px]:hidden`}>{"//"}</p>
          <p className={monoTextClass}>
            Built by{" "}
            <a
              href="https://www.youtube.com/@admin12121"
              target="_blank"
              rel="noreferrer"
            >
              Admin12121
            </a>
          </p>
        </div>

        <div
          ref={explosionContainerRef}
          className="pointer-events-none absolute bottom-0 left-0 h-[200%] w-full overflow-hidden max-[1000px]:hidden"
        />
      </div>
    </footer>
  );
}
