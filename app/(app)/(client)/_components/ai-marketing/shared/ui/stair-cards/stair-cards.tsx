'use client';

import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type StairCardsProps = {
  children: React.ReactNode;
  className?: string;
  baseOffset?: number;
  stepOffset?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  end?: string;
  scrub?: boolean;
  once?: boolean;
};

const StairCards = ({
  children,
  className,
  baseOffset = 150,
  stepOffset = 22,
  duration = 1,
  stagger = 0.1,
  start = 'top 80%',
  end = 'top 10%',
  scrub = false,
  once = true,
}: StairCardsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('[data-stair-card]');

    cards.forEach((card, index) => {
      const offset = baseOffset + index * stepOffset;

      gsap.set(card, {
        y: offset,
      });
    });

    gsap.to(cards, {
      y: 0,
      duration,
      ease: 'power3.out',
      stagger,
      scrollTrigger: {
        trigger: container,
        start,
        end,
        once,
        scrub,
      },
    });
  }, [baseOffset, stepOffset, duration, stagger, start, end, scrub, once]);

  return (
    <div ref={containerRef} className={cn(className)}>
      {children}
    </div>
  );
};

export { StairCards };
