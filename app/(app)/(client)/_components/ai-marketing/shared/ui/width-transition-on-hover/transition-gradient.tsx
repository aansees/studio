import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';

type TransitionGradientProps = {
  className?: string;
};

const TransitionGradient = ({ className }: TransitionGradientProps) => {
  return (
    <div
      className={cn(
        'partner-ship-gradient pointer-events-none absolute top-1/2 -left-[46%] z-0 h-[256px] w-[500px] -translate-y-1/2 rounded-[500px] bg-[#B962E7] blur-[90px] select-none',
        className
      )}
    ></div>
  );
};

export default TransitionGradient;
