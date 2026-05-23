import NumberAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/number-animation';
import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { ExternalLinkArrowIcon } from '@/app/(app)/(client)/_components/ai-marketing/shared/icon';
import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';

export type CaseStudyStat = {
  value: number;
  suffix: string;
  label: string;
};

export type CaseStudyCardProps = {
  img: string;
  title: string;
  desc: string;
  stats: CaseStudyStat[];
  href: string;
  className?: string;
};

const CaseStudyCard = ({ img, title, desc, stats, href, className }: CaseStudyCardProps) => (
  <div className={cn('group relative h-[640px]', className)}>
    <Link
      href={href}
      className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 translate-y-[40%] opacity-0 transition-all duration-500 ease-in-out group-hover:-translate-y-1/2 group-hover:opacity-100"
    >
      <div className="bg-background-13/50 group/link flex size-18.5 items-center justify-center rounded-full backdrop-blur-[6px] transition-all duration-400 ease-in-out hover:scale-110">
        <span className="relative size-6 overflow-hidden">
          <ExternalLinkArrowIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-400 ease-in-out group-hover/link:translate-x-[40%] group-hover/link:-translate-y-full" />
          <ExternalLinkArrowIcon className="absolute top-1/2 left-1/2 translate-x-[-180%] translate-y-[90%] transition-all duration-400 ease-in-out group-hover/link:-translate-x-1/2 group-hover/link:-translate-y-1/2" />
        </span>
      </div>
    </Link>

    <div className="pointer-events-none absolute inset-0 z-2 rounded-lg bg-linear-[0deg,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.45)_100%] opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100" />

    <figure className="image-loading-reveal pointer-events-auto size-full overflow-hidden rounded-lg">
      <Link href={href}>
        <Image
          src={img}
          alt={title}
          width={1200}
          height={640}
          className="size-full object-cover transition-all duration-500 ease-in-out group-hover:scale-105!"
        />
      </Link>
    </figure>

    <RevealAnimation delay={0.1}>
      <div className="bg-background-13/50 absolute bottom-3 left-1/2 z-2 flex w-[calc(100%-28px)] -translate-x-1/2 flex-col items-center rounded p-3 backdrop-blur-[17px] md:bottom-6 md:min-h-[80px] md:w-[calc(100%-48px)] md:flex-row md:p-5">
        <Link href={href}>
          <div className="w-full md:w-[80%] lg:w-full">
            <h3 className="text-is-heading-5 font-normal text-white/90">{title}</h3>
            <p className="text-tagline-3 md:text-tagline-2 font-inter-tight text-white/50">
              {desc}
            </p>
          </div>
        </Link>

        <div className="hidden w-full items-center justify-end gap-x-6 md:flex md:w-[60%]">
          {stats.map((stat, index) => (
            <Fragment key={stat.label}>
              <div>
                <h4 className="text-is-heading-6 flex items-center font-normal text-white/90">
                  <NumberAnimation
                    number={stat.value}
                    rooms={stat.suffix === 'x' ? 1 : 2}
                    showPercentage={stat.suffix === '%'}
                  />
                  {stat.suffix === 'x' ? 'x' : ''}
                </h4>
                <p className="text-tagline-3 text-white/60">{stat.label}</p>
              </div>
              {index < stats.length - 1 && (
                <div className="bg-stroke-1/10 hidden h-[60px] w-px md:block" />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </RevealAnimation>
  </div>
);

export default CaseStudyCard;
