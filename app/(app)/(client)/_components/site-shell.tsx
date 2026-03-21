"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { HomeFooter } from "./home-footer";
import { TransitionRouterShell } from "./transition-router-shell";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();

  return (
    <TransitionRouterShell>
      <div className="relative isolate min-h-screen overflow-x-hidden">
        <Header key={pathname} />
        {children}
        <HomeFooter />
      </div>
    </TransitionRouterShell>
  );
}
