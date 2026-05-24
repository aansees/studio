'use client';

import opaiAvatarImg25 from '@/public/images/opai-avatar-img-25.png';
import opaiImg24 from '@/public/images/opai-img-24.png';
import vector01 from '@/public/images/vector-01.svg';
import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import AvatarItem from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/avatar-reveal/avatar-item';
import AvatarReveal from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/avatar-reveal/avatar-reveal';
import { PrimaryLinkButton } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/button/primary-link-button';
import { useCtaContentImageAnimation } from '@/app/(app)/(client)/_components/ai-marketing/hooks/use-cta-content-image-animation';
import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Image from 'next/image';
import { useRef } from 'react';

interface CtaProps {
  className?: string;
}

const CTA = ({ className }: CtaProps) => {
  const contentImageRef = useRef<HTMLSpanElement>(null);
  const contentImage2Ref = useRef<HTMLSpanElement>(null);
  useCtaContentImageAnimation(contentImageRef, contentImage2Ref);

  return (
    <section
      className={cn('bg-background-6 overflow-hidden py-14 md:py-20 lg:py-24 xl:py-28', className)}
    >
      <div className="main-container">
        <div className="space-y-14 pb-9">
          <AvatarReveal
            className="flex items-center justify-center gap-x-2"
            direction="left"
            stagger={0.1}
          >
            {[5, 6, 7, 8].map((i) => (
              <AvatarItem key={i} className="inline-block shrink-0">
                <Image
                  src={`/images/opai-avatar-img-0${i}.png`}
                  alt={`ANCS Studio team member ${i - 4}`}
                  width={56}
                  height={56}
                  className="inline-block size-14 rounded-full object-cover"
                />
              </AvatarItem>
            ))}
          </AvatarReveal>
          <div className="space-y-3">
            <RevealAnimation delay={0.1}>
              <h2 className="text-is-heading-3 lg:text-is-heading-2 font-instrument-serif text-center font-normal tracking-[-2.4px] text-white/90">
                <span className="inline-flex flex-wrap items-start justify-center gap-x-1 sm:flex-nowrap md:items-center">
                  <span className="w-full sm:w-auto">Turn ideas</span>
                  <span
                    ref={contentImageRef}
                    className="cta-content-image inline-block h-[52px] w-[88px] overflow-hidden rounded-[300px] align-middle"
                  >
                    <Image src={opaiImg24} alt="" aria-hidden className="size-full object-cover" />
                  </span>
                  <span className="w-full sm:w-auto">into working products</span>
                </span>
                <br />
                <span className="inline-flex items-center justify-center gap-x-4">
                  <span
                    ref={contentImage2Ref}
                    className="cta-content-image-2 inline-block size-12 -rotate-20 overflow-hidden rounded-lg align-middle"
                  >
                    <Image
                      src={opaiAvatarImg25}
                      alt=""
                      aria-hidden
                      className="size-full object-cover"
                    />
                  </span>
                  <span>without the chaos</span>
                </span>
              </h2>
            </RevealAnimation>
            <RevealAnimation delay={0.2}>
              <p className="text-tagline-2 mx-auto w-full max-w-[320px] text-center text-white/60">
                Share the problem, timeline, and budget. We will help shape a practical build plan
                for a website, web app, or custom system.
              </p>
            </RevealAnimation>
          </div>
          <RevealAnimation delay={0.3}>
            <div className="flex justify-center">
              <PrimaryLinkButton href="/start-project">Start a project</PrimaryLinkButton>
            </div>
          </RevealAnimation>
        </div>
        <RevealAnimation delay={0.4} duration={3} direction="right" useSpring={true}>
          <figure className="flex justify-end">
            <Image src={vector01} quality={100} alt="CTA" width={1290} height={91} />
          </figure>
        </RevealAnimation>
      </div>
    </section>
  );
};

export default CTA;
