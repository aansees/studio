import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import { ReactNode } from 'react';

type CardContentProps = {
  children: ReactNode;
  className?: string;
};

const CardContent = ({ children, className }: CardContentProps) => {
  return <div className={cn('relative z-10 space-y-8', className)}>{children}</div>;
};

export default CardContent;
