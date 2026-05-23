"use client";

import Link from "next/link";
import { ButtonGridIcon } from "./button-grid-icon";
import { useButtonHoverTransform } from "./hooks/use-button-hover-transform";

export function NavButton() {
  const { wrapperRef, iconRef, textRef } = useButtonHoverTransform();

  return (
    <Link href="/signup" className="inline-block shrink-0" aria-label="Get started">
      <div
        ref={wrapperRef}
        className="button-inner bg-background-4 group button font-ibm-plex-mono text-tagline-2 text-background-11 flex h-11 w-full cursor-pointer items-center rounded-xl p-[3px] font-normal first-letter:uppercase"
      >
        <div
          ref={iconRef}
          className="button-icon relative z-20 h-9.5 w-11 overflow-hidden rounded-lg"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 z-10 size-full bg-linear-to-r from-[#ffffff00] from-0% to-[#000000] to-100% transition-all duration-700 ease-in-out"
            aria-hidden="true"
          >
            <div
              className="bg-opai-purple absolute inset-0 z-20 flex size-full items-center justify-center"
              style={{ boxShadow: "0 3px 10px 0 rgba(255, 255, 255, 0.4) inset" }}
            >
              <span className="flex size-6 items-center justify-center" aria-hidden="true">
                <ButtonGridIcon className="size-[14px]" />
              </span>
            </div>
          </div>
        </div>
        <span ref={textRef} className="button-text shrink-0 stroke-0 px-4" aria-hidden="true">
          Get started
        </span>
      </div>
    </Link>
  );
}
