'use client';

import { ImageRevealContext } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/image-reveal-on-hover/image-reveal-context';
import MediaLayer from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/image-reveal-on-hover/media-layer';
import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import gsap from 'gsap';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ImageRevealProps = {
  children: React.ReactNode;
  className?: string;
  cursorClassName?: string;
  mediaClassName?: string;
  followDuration?: number;
  showDuration?: number;
  revealDuration?: number;
};

const ImageReveal = forwardRef<HTMLDivElement, ImageRevealProps>(
  (
    {
      children,
      className,
      cursorClassName,
      mediaClassName,
      followDuration = 0.9,
      showDuration = 0.5,
      revealDuration = 0.6,
    },
    ref
  ) => {
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const setXRef = useRef<((value: number) => gsap.core.Tween) | null>(null);
    const setYRef = useRef<((value: number) => gsap.core.Tween) | null>(null);
    const idRef = useRef(0);
    const lastSrcRef = useRef('');

    const [items, setItems] = useState<{ id: number; src: string }[]>([]);

    useEffect(() => {
      const cursor = cursorRef.current;
      if (!cursor) return;

      gsap.set(cursor, {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
      });

      setXRef.current = gsap.quickTo(cursor, 'x', {
        duration: followDuration,
        ease: 'expo',
      });

      setYRef.current = gsap.quickTo(cursor, 'y', {
        duration: followDuration,
        ease: 'expo',
      });

      return () => {
        setXRef.current = null;
        setYRef.current = null;
      };
    }, [followDuration]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      setXRef.current?.(e.clientX);
      setYRef.current?.(e.clientY);
    }, []);

    const showCursor = useCallback(() => {
      if (!cursorRef.current) return;

      gsap.to(cursorRef.current, {
        scale: 1,
        opacity: 1,
        duration: showDuration,
        ease: 'expo.inOut',
      });
    }, [showDuration]);

    const hideCursor = useCallback(() => {
      if (!cursorRef.current) return;

      gsap.to(cursorRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      });

      lastSrcRef.current = '';
      setItems([]);
    }, []);

    const revealImage = useCallback((src: string) => {
      if (!src || lastSrcRef.current === src) return;

      lastSrcRef.current = src;

      setItems((prev) => [...prev, { id: ++idRef.current, src }]);
    }, []);

    const value = useMemo(
      () => ({
        revealImage,
      }),
      [revealImage]
    );

    return (
      <ImageRevealContext.Provider value={value}>
        <div
          ref={ref}
          className={cn('relative', className)}
          onPointerMove={handlePointerMove}
          onPointerEnter={showCursor}
          onPointerLeave={hideCursor}
        >
          {children}

          <div
            ref={cursorRef}
            className={cn(
              'pointer-events-none fixed top-0 left-0 z-9999 hidden h-[280px] w-[220px] md:block',
              cursorClassName
            )}
          >
            <div className={cn('relative size-full overflow-hidden rounded-2xl', mediaClassName)}>
              {items.map((item) => (
                <MediaLayer
                  key={item.id}
                  id={item.id}
                  src={item.src}
                  revealDuration={revealDuration}
                />
              ))}
            </div>
          </div>
        </div>
      </ImageRevealContext.Provider>
    );
  }
);

ImageReveal.displayName = 'ImageReveal';

export default ImageReveal;
