"use client";

import { useTransitionRouter } from "next-transition-router";

type RouterPushOptions = {
  scroll?: boolean;
};

type TransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
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

    const doc = document as TransitionDocument;

    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        router.push(href, options);
      });
      return;
    }

    router.push(href, options);
  };

  return { navigateWithTransition, router };
}
