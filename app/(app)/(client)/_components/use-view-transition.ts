"use client";

import { useTransitionRouter } from "next-transition-router";

type RouterPushOptions = {
  scroll?: boolean;
};

export function useViewTransition() {
  const router = useTransitionRouter();

  const navigateWithTransition = (
    href: string,
    options: RouterPushOptions = {},
  ) => {
    if (typeof window !== "undefined" && window.location.pathname === href) {
      return;
    }

    router.push(href, options);
  };

  return { navigateWithTransition, router };
}
