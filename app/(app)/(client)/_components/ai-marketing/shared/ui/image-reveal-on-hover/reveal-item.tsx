'use client';

import { useImageReveal } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/image-reveal-on-hover/image-reveal-context';
import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Link from 'next/link';
import React, { forwardRef } from 'react';

type RevealItemProps = {
  image: string;
  children: React.ReactNode;
  href?: string;
  className?: string;
};

const RevealItem = forwardRef<HTMLElement, RevealItemProps>(
  ({ image, children, href, className }, ref) => {
    const { revealImage } = useImageReveal();

    const sharedProps = {
      className: cn('block', className),
      onPointerEnter: () => revealImage(image),
    };

    if (href) {
      return (
        <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} {...sharedProps}>
          {children}
        </Link>
      );
    }

    return (
      <div ref={ref as React.Ref<HTMLDivElement>} {...sharedProps}>
        {children}
      </div>
    );
  }
);

RevealItem.displayName = 'RevealItem';

export default RevealItem;
