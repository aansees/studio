"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { HomeFooter } from "./home-footer";
import { TransitionRouterShell } from "./transition-router-shell";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const resetScroll = () => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    resetScroll();

    const frameId = window.requestAnimationFrame(resetScroll);
    const timeoutId = window.setTimeout(resetScroll, 60);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  return (
    <TransitionRouterShell>
      <Header key={pathname} />
      {children}
      <HomeFooter />
    </TransitionRouterShell>
  );
}
