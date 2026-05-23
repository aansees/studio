'use client';

import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Link from 'next/link';
import { ReactNode } from 'react';

type TransitionCardProps = {
  href: string;
  children: ReactNode;
  className?: string;
  /** Controlled by TransitionWrapper: whether this card is the active (expanded) one */
  isActive?: boolean;
  /** Called when the card is hovered; used by TransitionWrapper for active state */
  onMouseEnter?: () => void;
};

const TransitionCard = ({
  href,
  children,
  className,
  isActive = false,
  onMouseEnter,
}: TransitionCardProps) => {
  return (
    <div
      className={cn(
        'partner-ship-card bg-background-5 border-stroke-1/11 relative block h-[420px] overflow-hidden border px-8 py-11 md:h-[333px]',
        isActive && 'active-partner-ship-card',
        className
      )}
      onMouseEnter={onMouseEnter}
    >
      <Link href={href}>{children}</Link>
    </div>
  );
};

export default TransitionCard;
