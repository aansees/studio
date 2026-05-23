import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import { ReactNode } from 'react';

type CardTitleProps = {
  children: ReactNode;
  className?: string;
};

const CardTitle = ({ children, className }: CardTitleProps) => {
  return <h3 className={cn('text-is-heading-5 font-normal text-white', className)}>{children}</h3>;
};

export default CardTitle;
