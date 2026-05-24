"use client";

import { useRef } from "react";
import { useExpandWidthFromCenter } from "@/app/(app)/(client)/_components/ai-marketing/hooks/use-expand-width-from-center";

export function FooterBottom() {
  const barRef = useRef<HTMLDivElement>(null);
  useExpandWidthFromCenter(barRef, 1.7);

  return (
    <div
      ref={barRef}
      className="border-stroke-1/10 flex justify-end border-y px-5 py-3.5 lg:py-5"
    >
      <p className="font-inter-tight text-tagline-4 font-normal text-white/50">
        &copy; {new Date().getFullYear()} Ancs Studio. All rights reserved.
      </p>
    </div>
  );
}
