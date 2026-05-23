import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import { ReactNode } from 'react';

type CardDescriptionProps = {
  children: ReactNode;
  className?: string;
};
const CardDescription = ({ children, className }: CardDescriptionProps) => {
  return (
    <p
      className={cn(
        'partner-ship-description text-tagline-2 font-inter-tight line-clamp-5 text-white/60 lg:line-clamp-3 xl:line-clamp-5',
        className
      )}
    >
      {children}
    </p>
  );
};

export default CardDescription;
