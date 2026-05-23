'use client';

import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import { Children, isValidElement, ReactNode, useState } from 'react';

type HoverActiveCardGroupProps = {
  children: ReactNode;
  /** Class for the outer container (e.g. flex layout). */
  className?: string;
  /** Class for each card wrapper (default: 'blog-card'). */
  cardWrapperClassName?: string;
  /** Class applied to the hovered/active card (default: 'active-card'). */
  activeCardClassName?: string;
};

/** Renders a group of cards; the hovered card gets the active class, others do not. */
const HoverActiveCardGroup = ({
  children,
  className,
  cardWrapperClassName = 'blog-card',
  activeCardClassName = 'active-card',
}: HoverActiveCardGroupProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={cn(className)}>
      {Children.map(children, (child, index) => (
        <div
          key={isValidElement(child) && child.key != null ? child.key : `hover-active-card-${index}`}
          className={cn(cardWrapperClassName, activeIndex === index && activeCardClassName)}
          onMouseEnter={() => setActiveIndex(index)}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

HoverActiveCardGroup.displayName = 'HoverActiveCardGroup';

export default HoverActiveCardGroup;
