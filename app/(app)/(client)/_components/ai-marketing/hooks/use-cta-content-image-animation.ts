'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';

gsap.registerPlugin(ScrollTrigger);

const useCtaContentImageAnimation = (
  contentImageRef: RefObject<HTMLElement | null>,
  contentImage2Ref: RefObject<HTMLElement | null>
) => {
  useGSAP(
    () => {
      const contentImage = contentImageRef.current;
      const contentImage2 = contentImage2Ref.current;
      if (!contentImage || !contentImage2) return;

      gsap.from(contentImage, {
        duration: 1.7,
        delay: 0.3,
        scaleX: 0,
        width: 0,
        transformOrigin: 'left center',
        autoAlpha: 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: contentImage,
          start: 'top 85%',
          end: 'bottom 20%',
          once: true,
        },
      });

      gsap.from(contentImage2, {
        y: 120,
        duration: 1.3,
        delay: 0.2,
        scale: 0,
        opacity: 0,
        rotation: 40,
        transformOrigin: 'center center',
        ease: 'power2.out',
        scrollTrigger: {
          trigger: contentImage,
          start: 'top 85%',
          end: 'bottom 20%',
          once: true,
        },
      });
    },
    { scope: contentImageRef, dependencies: [] }
  );
};

export { useCtaContentImageAnimation };
