import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';

type CardArrowProps = {
  className?: string;
};
const CardArrow = ({ className }: CardArrowProps) => {
  return (
    <div>
      <svg
        className={cn('partner-ship-arrow-icon size-13 fill-none stroke-[#F8F9FA]', className)}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 52 52"
        fill="none"
      >
        <path d="M15.168 36.8307L36.8346 15.1641" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.168 15.1641H36.8346V36.8307" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export default CardArrow;
