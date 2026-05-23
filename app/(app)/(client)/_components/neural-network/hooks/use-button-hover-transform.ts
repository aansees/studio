"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

export interface ButtonHoverTransformRefs {
  wrapperRef: RefObject<HTMLDivElement | null>;
  iconRef: RefObject<HTMLDivElement | null>;
  textRef: RefObject<HTMLSpanElement | null>;
}

export function useButtonHoverTransform(): ButtonHoverTransformRefs {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const buttonWrapper = wrapperRef.current;
    const iconWrapper = iconRef.current;
    const buttonText = textRef.current;

    if (!buttonWrapper || !iconWrapper || !buttonText) {
      return;
    }

    const onMouseEnter = () => {
      const wrapperRect = buttonWrapper.getBoundingClientRect();
      const iconRect = iconWrapper.getBoundingClientRect();
      const textRect = buttonText.getBoundingClientRect();
      const leftPadding = Number.parseFloat(getComputedStyle(buttonWrapper).paddingLeft) || 0;
      const rightPadding = Number.parseFloat(getComputedStyle(buttonWrapper).paddingRight) || 0;
      const iconLeftRelative = iconRect.left - wrapperRect.left;
      const iconTranslateXDistance =
        wrapperRect.width - rightPadding - iconWrapper.offsetWidth - iconLeftRelative;
      const textLeftRelative = textRect.left - wrapperRect.left;
      const textTranslateXDistance = Math.max(0, textLeftRelative - leftPadding);

      iconWrapper.style.transform = `translateX(${iconTranslateXDistance}px)`;
      buttonText.style.transform = `translateX(-${textTranslateXDistance}px)`;
    };

    const onMouseLeave = () => {
      iconWrapper.style.transform = "translateX(0)";
      buttonText.style.transform = "translateX(0)";
    };

    buttonWrapper.addEventListener("mouseenter", onMouseEnter);
    buttonWrapper.addEventListener("mouseleave", onMouseLeave);

    return () => {
      buttonWrapper.removeEventListener("mouseenter", onMouseEnter);
      buttonWrapper.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return { wrapperRef, iconRef, textRef };
}
