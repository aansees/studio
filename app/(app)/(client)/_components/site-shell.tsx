"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { HomeFooter } from "./home-footer";
import { TransitionRouterShell } from "./transition-router-shell";
import { registerDocumentEntryPath } from "./document-entry-state";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  registerDocumentEntryPath(pathname);

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
