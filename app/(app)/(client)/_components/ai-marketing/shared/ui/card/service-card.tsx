import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Link from 'next/link';

export type ServiceCardProps = {
  iconClass: string;
  title: string;
  description: string;
  href?: string;
  className?: string;
};

const ServiceCard = ({
  iconClass,
  title,
  description,
  href,
  className,
}: ServiceCardProps) => (
  <div
    // href={href}
    className={cn(
      'group relative inline-block w-full py-4 pl-0 transition-all duration-300 ease-out hover:pl-4 lg:py-8',
      className
    )}
  >
    <div className="bg-background-8 absolute inset-0 h-0 transition-all duration-300 ease-out group-hover:h-full" />

    <div className="relative z-10 flex gap-x-4 gap-y-2">
      <span
        className={cn(
          iconClass,
          'group-hover:text-background-13/90 text-[52px] text-white/60 transition-all duration-300 ease-out max-lg:scale-90'
        )}
      />

      <div className="lg:max-w-[465px]">
        <h3 className="font-instrument-serif group-hover:text-background-13/90 md:text-is-heading-5 text-[26px] font-normal text-white/80 transition-colors duration-300 ease-out">
          {title}
        </h3>

        <p className="text-tagline-2 group-hover:text-background-13/60 font-normal text-white/60 transition-colors duration-300 ease-out">
          {description}
        </p>
      </div>
    </div>
  </div>
);

export default ServiceCard;
