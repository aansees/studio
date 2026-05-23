'use client';

import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import gsap from 'gsap';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

type MediaLayerProps = {
  id: number;
  src: string;
  revealDuration: number;
  className?: string;
};

const MediaLayer = ({ id, src, revealDuration, className }: MediaLayerProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const image = imageRef.current;

    if (!wrapper || !image) return;

    gsap.set(wrapper, { yPercent: -100 });
    gsap.set(image, { yPercent: 90 });

    const tl = gsap.timeline();

    tl.to(wrapper, {
      yPercent: 0,
      duration: revealDuration,
      ease: 'expo.inOut',
    }).to(
      image,
      {
        yPercent: 0,
        duration: revealDuration,
        ease: 'expo.inOut',
      },
      0
    );

    return () => {
      tl.kill();
    };
  }, [id, revealDuration]);

  return (
    <div ref={wrapperRef} className={cn('absolute inset-0 overflow-hidden', className)}>
      <div ref={imageRef} className="absolute inset-0">
        <Image src={src} width={292} height={386} alt="reveal image" className="object-cover" />
      </div>
    </div>
  );
};

export default MediaLayer;
