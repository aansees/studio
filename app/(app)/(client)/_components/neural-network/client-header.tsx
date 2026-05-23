"use client";

import Link from "next/link";
import RevealAnimation from "@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation";
import { cn } from "@/app/(app)/(client)/_components/ai-marketing/utils/cn";
import { useNavbarScroll } from "./hooks/use-navbar-scroll";
import { NavButton } from "./nav-button";

export function ClientHeader() {
  const scroll = useNavbarScroll(100);

  return (
    <header
      className={cn(
        "lp:max-w-[1290px]! fixed top-5 left-1/2 z-50 mx-auto w-full max-w-[350px] -translate-x-1/2 transition-all duration-400 ease-in-out min-[425px]:max-w-[375px] min-[500px]:max-w-[450px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]",
        scroll.isScrolled && "top-2",
      )}
    >
      <RevealAnimation direction="up" offset={100} delay={0.1} instant>
        <div className="header-one flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-1 py-1 backdrop-blur-[25px]">
          <Link
            href="/"
            aria-label="Ancs Studio home"
            className="inline-flex min-w-0 items-center px-1.5 sm:px-3"
          >
            <span style={{ lineHeight: '1px' }} className="font-otis-display text-background-13 text-[27px] leading-none sm:text-[32px]">
              Ancs Studio
            </span>
          </Link>
          <NavButton />
        </div>
      </RevealAnimation>
    </header>
  );
}
