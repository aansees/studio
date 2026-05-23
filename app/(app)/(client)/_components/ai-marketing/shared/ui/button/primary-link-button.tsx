'use client';

import { ChevronRightIcon } from '@/app/(app)/(client)/_components/ai-marketing/shared/icon';
import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Link from 'next/link';

export interface PrimaryLinkButtonProps {
  href: string;
  children: string;
  className?: string;
  displayClassName?: string;
  external?: boolean;
}

const PrimaryLinkButton = ({
  href,
  children,
  className,
  displayClassName,
  external = false,
}: Readonly<PrimaryLinkButtonProps>) => {
  return (
    <Link
      href={href}
      aria-label={children}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'group bg-background-7 hover:border-stroke-3 relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-transparent px-6 py-[13px] transition-all duration-300 ease-in-out',
        displayClassName,
        className
      )}
    >
      <div className="h-full max-h-5 overflow-hidden">
        <span
          className="font-ibm-plex-mono text-background-13/90 text-tagline-2 block -translate-y-0.5 leading-[1.4] font-medium text-nowrap transition-transform duration-500 ease-in-out group-hover:-translate-y-[105%]"
          aria-hidden
        >
          {children}
        </span>
        <span
          className="font-ibm-plex-mono text-tagline-2 block leading-[1.4] font-medium text-nowrap transition-transform duration-500 ease-in-out group-hover:-translate-y-[105%]"
          aria-hidden
        >
          {children}
        </span>
      </div>

      <div className="relative mt-[1.5px] flex size-6 items-center justify-center overflow-hidden">
        <span className="bg-background-6 absolute size-[22px] translate-x-0 rounded-full transition-all duration-400 ease-in-out">
          <span className="stroke-background-10 absolute size-[16px] translate-x-[2.5px] translate-y-0.5 scale-95 stroke-2 transition-all duration-400 ease-in-out group-hover:translate-x-6">
            <ChevronRightIcon className="size-[18px]" />
          </span>
        </span>
        <span className="stroke-background-10 absolute size-[18px] -translate-x-6 stroke-2 transition-all duration-400 ease-in-out group-hover:translate-x-0">
          <ChevronRightIcon className="size-[18px]" />
        </span>
      </div>
    </Link>
  );
};

export { PrimaryLinkButton };
