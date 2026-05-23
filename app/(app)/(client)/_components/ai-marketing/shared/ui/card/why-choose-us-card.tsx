import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';

const gradientBlobClass =
  'pointer-events-none absolute -top-[16%] -right-[26%] z-0 h-[256px] w-[306px] -translate-y-[20%] rounded-[306px] bg-linear-[190deg,#744FB3_52.06%,#FF9C7B_92.8%] opacity-0 blur-[50px] transition-all duration-500 ease-in-out select-none group-hover:translate-y-0 group-hover:opacity-100';

export type WhyChooseUsCardProps = {
  shapeClass: string;
  title: string;
  className?: string;
};

const WhyChooseUsCard = ({ shapeClass, title, className }: WhyChooseUsCardProps) => (
  <div
    className={cn(
      'bg-background-6 group border-stroke-1/11 relative flex min-h-[430px] flex-col justify-between gap-2.5 overflow-hidden p-8 max-lg:border-b md:min-h-[471px] md:border-r',
      className
    )}
  >
    <div className={gradientBlobClass} />

    <div className={cn(shapeClass, 'text-[52px] text-white/80 md:text-[68px]')} />

    <h3 className="font-instrument-serif text-is-heading-5 font-normal text-white/60 transition-colors duration-500 ease-in-out group-hover:text-white lg:max-w-[240px]">
      {title}
    </h3>
  </div>
);

export default WhyChooseUsCard;
