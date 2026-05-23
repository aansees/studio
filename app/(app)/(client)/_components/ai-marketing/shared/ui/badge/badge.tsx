import { BadgeStarIcon } from '@/app/(app)/(client)/_components/ai-marketing/shared/icon';
import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import React from 'react';

export interface BadgeProps {
  badgeText: string;
  className?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ badgeText, className }, ref) => (
  <span
    ref={ref}
    className={cn(
      'fill-opai-blue font-inter-tight text-tagline-4 text-background-13/70 flex items-center gap-x-1 font-normal',
      className
    )}
  >
    <span className="flex size-4 items-center justify-center">
      <BadgeStarIcon />
    </span>
    <span>{badgeText}</span>
  </span>
));

Badge.displayName = 'Badge';

export { Badge };
