'use client';

import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';
import { SecondaryLinkButton } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/button/secondary-link-button';
import CardArrow from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/width-transition-on-hover/card-arrow';
import CardContent from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/width-transition-on-hover/card-content';
import CardDescription from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/width-transition-on-hover/card-description';
import CardIcon from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/width-transition-on-hover/card-icon';
import CardTitle from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/width-transition-on-hover/card-title';
import TransitionCard from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/width-transition-on-hover/transition-card';
import TransitionGradient from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/width-transition-on-hover/transition-gradient';
import TransitionWrapper from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/width-transition-on-hover/transition-wrapper';
import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import React, { useState } from 'react';

export interface PartnerShipsProps {
  className?: string;
}

const PartnerShips: React.FC<PartnerShipsProps> = ({ className }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const partners = [
    {
      img: '/images/icons/meta.png',
      alt: 'meta',
      title: 'Meta Marketing Partner',
      description:
        "As a Meta Marketing Partner, we specialize in digital marketing strategies that leverage Meta's platforms to drive your business growth. Our tailored approaches and expert insights enhance your advertising efforts and broaden your audience reach, ensuring you remain a strong contender in the online marketing landscape.",
    },
    {
      img: '/images/icons/google-ads-certified.png',
      alt: 'google ads certified',
      title: 'Google Ads Certified Partner',
      description:
        "As a Google Ads Certified Partner, we specialize in digital marketing strategies that leverage Google's platforms to drive your business growth. Our tailored approaches and expert insights enhance your advertising efforts and broaden your audience reach, ensuring you remain a strong contender in the online marketing landscape.",
    },
    {
      img: '/images/icons/klaviyo.png',
      alt: 'klaviyo',
      title: 'Klaviyo Partner',
      description:
        "As a Klaviyo Partner, we specialize in digital marketing strategies that leverage Klaviyo's platforms to drive your business growth. Our tailored approaches and expert insights enhance your email marketing efforts and broaden your audience reach, ensuring you remain a strong contender in the online marketing landscape.",
    },
  ];

  return (
    <section className={cn('bg-background-7 pt-20 md:pt-30 lg:pt-44', className)}>
      <div className="main-container space-y-10 md:space-y-17.5">
        <div className="space-y-1.5 text-center md:space-y-3">
          <RevealAnimation delay={0.1}>
            <div className="flex items-center justify-center max-md:pb-3">
              <Badge badgeText="Partnership" className="text-black" />
            </div>
          </RevealAnimation>
          <RevealAnimation delay={0.2}>
            <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 text-background-13 pt-1 font-normal max-md:leading-[1.1]">
              Certified by the Best
            </h2>
          </RevealAnimation>
          <RevealAnimation delay={0.3}>
            <p className="text-tagline-2 text-background-13/60 font-normal">
              Discover expert tips, industry trends, and actionable strategies to power your growth
              with Nexsas.
            </p>
          </RevealAnimation>
        </div>
        <RevealAnimation delay={0.4}>
          <TransitionWrapper>
            {partners.map((p, i) => (
              <TransitionCard
                key={p.title}
                href="/team"
                isActive={activeIndex === i}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <TransitionGradient />
                <CardContent>
                  <CardIcon src={p.img} alt={p.alt} />
                  <div className="flex justify-between gap-21">
                    <div>
                      <CardTitle> {p.title}</CardTitle>
                      <CardDescription>{p.description}</CardDescription>
                    </div>
                    <div>
                      <CardArrow />
                    </div>
                  </div>
                </CardContent>
              </TransitionCard>
            ))}
          </TransitionWrapper>
        </RevealAnimation>
        <RevealAnimation delay={0.1}>
          <div className="flex justify-center">
            <SecondaryLinkButton href="/pricing" displayClassName="w-[85%] md:w-auto">
              Let&apos;s get started
            </SecondaryLinkButton>
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

export default PartnerShips;
