'use client';

import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactNode, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export type CardRevealItemProps = {
  children: ReactNode;
  className?: string;
};

const CardRevealItem = ({ children, className }: CardRevealItemProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      gsap.set(wrapper, {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
        opacity: 0,
        scale: 0.9,
      });

      gsap.fromTo(
        wrapper,
        {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
          opacity: 0,
          scale: 0.9,
        },
        {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          opacity: 1,
          scale: 1,
          ease: 'back.in',
          duration: 0.8,
          scrollTrigger: {
            trigger: wrapper,
            start: 'top 96%',
            end: 'bottom 58%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: wrapperRef }
  );

  return (
    <div ref={wrapperRef} className={cn(className)}>
      {children}
    </div>
  );
};

export default CardRevealItem;
