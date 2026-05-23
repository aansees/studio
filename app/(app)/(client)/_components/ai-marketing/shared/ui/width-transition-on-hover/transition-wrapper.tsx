import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import { forwardRef, ReactNode } from 'react';

type TransitionWrapperProps = {
  children: ReactNode;
  className?: string;
};

const TransitionWrapper = forwardRef<HTMLDivElement, TransitionWrapperProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-start justify-center gap-y-5 lg:flex-row [&>div]:rounded-lg lg:[&>div]:rounded-none lg:[&>div:first-child]:rounded-l-lg lg:[&>div:last-child]:rounded-r-lg',
        className
      )}
    >
      {children}
    </div>
  )
);

TransitionWrapper.displayName = 'TransitionWrapper';

export default TransitionWrapper;
