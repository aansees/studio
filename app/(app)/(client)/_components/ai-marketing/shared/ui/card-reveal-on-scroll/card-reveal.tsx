import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import { ReactNode } from 'react';

export type CardRevealProps = {
  children: ReactNode;
  className?: string;
};

const CardReveal = ({ children, className }: CardRevealProps) => {
  return <div className={cn(className)}> {children}</div>;
};

export default CardReveal;
