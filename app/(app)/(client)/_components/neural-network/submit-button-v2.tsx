"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/app/(app)/(client)/_components/ai-marketing/utils/cn";
import { ButtonGridIcon } from "./button-grid-icon";

export interface SubmitButtonV2Props
  extends Omit<ComponentPropsWithoutRef<"button">, "type"> {
  innerClassName?: string;
  iconClassName?: string;
  buttonTextClassName?: string;
  type?: "submit";
}

export const SubmitButtonV2 = forwardRef<HTMLButtonElement, SubmitButtonV2Props>(
  function SubmitButtonV2(
    {
      className,
      innerClassName,
      iconClassName,
      buttonTextClassName,
      children,
      ...buttonProps
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="submit"
        className={cn("w-full", className)}
        aria-label={typeof children === "string" ? children : undefined}
        {...buttonProps}
      >
        <div
          className={cn(
            "group/submit-button-v2 bg-background-4 font-ibm-plex-mono text-tagline-2 text-background-11 h-full max-h-[52px] w-full shrink-0 cursor-pointer rounded-2xl stroke-0 p-1 font-normal first-letter:uppercase",
            innerClassName,
          )}
        >
          <div className="flex items-center gap-x-4">
            <div
              className={cn("relative z-20 h-11 w-[60px] overflow-hidden rounded-[13px]", iconClassName)}
              aria-hidden
            >
              <div
                className={cn(
                  "absolute inset-0 z-10 size-full overflow-hidden bg-linear-to-r from-[#ffffff00] from-0% to-[#000000] to-100%",
                  iconClassName,
                )}
                aria-hidden
              >
                <div
                  className={cn(
                    "bg-opai-purple absolute z-20 flex size-full items-center justify-center overflow-hidden",
                    iconClassName,
                  )}
                  style={{ boxShadow: "0 3px 10px 0 rgba(255, 255, 255, 0.4) inset" }}
                >
                  <span
                    className="relative flex size-6 items-center justify-center overflow-hidden"
                    aria-hidden
                  >
                    <ButtonGridIcon className="absolute size-[14px] translate-x-0 fill-white/80 transition-all duration-500 ease-in-out group-hover/submit-button-v2:translate-x-[140%]" />
                    <ButtonGridIcon className="absolute size-[14px] -translate-x-[140%] fill-white/80 transition-all duration-500 ease-in-out group-hover/submit-button-v2:translate-x-0" />
                  </span>
                </div>
              </div>
            </div>
            <span className={cn("pr-5", buttonTextClassName)} aria-hidden>
              {children}
            </span>
          </div>
        </div>
      </button>
    );
  },
);

SubmitButtonV2.displayName = "SubmitButtonV2";
