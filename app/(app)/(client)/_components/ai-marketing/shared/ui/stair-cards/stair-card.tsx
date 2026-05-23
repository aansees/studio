import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';

type StairCardProps = {
  children: React.ReactNode;
  className?: string;
};

const StairCard = ({ children, className }: StairCardProps) => (
  <div data-stair-card className={cn(className)}>
    {children}
  </div>
);

export { StairCard };
