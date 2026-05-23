'use client';

import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Link from 'next/link';

export interface SecondaryLinkButtonProps {
  href: string;
  children: string;
  className?: string;
  displayClassName?: string;
  external?: boolean;
}

const SecondaryLinkButton = ({
  href,
  children,
  className,
  displayClassName,
  external = false,
}: Readonly<SecondaryLinkButtonProps>) => {
  return (
    <Link
      href={href}
      aria-label={children}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'group bg-background-14 relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-[13px] transition-all duration-300 ease-in-out',
        displayClassName,
        className
      )}
    >
      <div className="h-full max-h-5 overflow-hidden">
        <span
          className="font-ibm-plex-mono text-tagline-2 text-background-7 block -translate-y-0.5 leading-[1.4] font-medium text-nowrap transition-transform duration-500 ease-in-out group-hover:-translate-y-[105%]"
          aria-hidden
        >
          {children}
        </span>
        <span
          className="font-ibm-plex-mono text-background-7 text-tagline-2 block leading-[1.4] font-medium text-nowrap transition-transform duration-500 ease-in-out group-hover:-translate-y-[105%]"
          aria-hidden
        >
          {children}
        </span>
      </div>

      <div className="relative mt-[1.5px] flex size-6 items-center justify-center overflow-hidden">
        {/* circle */}
        <span className="bg-background-7 absolute size-[22px] translate-x-0 rounded-full transition-all duration-400 ease-in-out">
          {/* arrow */}
          <span className="stroke-background-14 absolute size-[16px] translate-x-[2.5px] translate-y-0.5 scale-95 stroke-2 transition-all duration-400 ease-in-out group-hover:translate-x-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="size-4 stroke-background-14"
            >
              <path
                d="M6.75 13.5L11.25 9L6.75 4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>

        {/* arrow */}
        <span className="stroke-background-14 absolute size-[18px] -translate-x-6 stroke-2 transition-all duration-400 ease-in-out group-hover:translate-x-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className="size-[18px] stroke-background-14"
          >
            <path
              d="M6.75 13.5L11.25 9L6.75 4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </Link>
  );
};

export { SecondaryLinkButton };
