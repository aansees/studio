'use client';

import ReactIcon from '@/public/images/icons/react.svg';
import OpaiAvatarImg02 from '@/public/images/opai-avatar-img-02.png';
import OpaiAvatarImg04 from '@/public/images/opai-avatar-img-04.png';
import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import AboutSwiper from '@/app/(app)/(client)/_components/ai-marketing/home/about-swiper';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';
import { PrimaryLinkButton } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/button/primary-link-button';
import { useExpandWidthFromCenter } from '@/app/(app)/(client)/_components/ai-marketing/hooks/use-expand-width-from-center';
import Image from 'next/image';
import { useRef } from 'react';
import 'swiper/css';

const About = () => {
  const aboutBorderRef = useRef<HTMLDivElement>(null);
  const aboutBorderRef2 = useRef<HTMLDivElement>(null);
  useExpandWidthFromCenter(aboutBorderRef);
  useExpandWidthFromCenter(aboutBorderRef2);
  return (
    <section className="bg-background-5 overflow-hidden py-16 md:py-24 lg:py-28 xl:py-36 2xl:py-44">
      <div className="main-container space-y-10 md:space-y-28">
        <div className="flex items-center justify-between gap-x-3 overflow-hidden md:gap-x-19">
          <div className="flex items-center gap-x-6">
            <div
              ref={aboutBorderRef}
              className="bg-stroke-1/11 h-px w-[50px] md:w-[220px] lg:w-[300px] xl:w-[450px]"
            />
            <RevealAnimation delay={0.3} offset={100} direction="left">
              <figure className="size-10 overflow-hidden rounded-[40px]">
                <Image
                  src={OpaiAvatarImg04}
                  alt="about"
                  width={40}
                  height={40}
                  className="size-full object-contain"
                />
              </figure>
            </RevealAnimation>
          </div>
          <RevealAnimation delay={0.4} offset={100} direction="up">
            <figure className="size-9">
              <Image
                src={ReactIcon}
                alt="react"
                width={36}
                height={36}
                className="size-full object-contain"
              />
            </figure>
          </RevealAnimation>

          <div className="flex items-center gap-x-6">
            <RevealAnimation delay={0.5} offset={100} direction="right">
              <figure className="size-10 overflow-hidden rounded-[40px]">
                <Image
                  src={OpaiAvatarImg02}
                  alt="about"
                  width={40}
                  height={40}
                  className="size-full object-contain"
                />
              </figure>
            </RevealAnimation>
            <div
              ref={aboutBorderRef2}
              className="bg-stroke-1/11 h-px w-[50px] md:w-[450px] lg:w-[300px] xl:w-[450px]"
            />
          </div>
        </div>
        <div className="space-y-1.5 text-center md:space-y-3">
          <RevealAnimation delay={0.2}>
            <div className="flex items-center justify-center">
              <Badge badgeText="About Us" className="text-white/50" />
            </div>
          </RevealAnimation>
          <RevealAnimation delay={0.3}>
            <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 pt-2.5 font-normal text-white/90 max-md:leading-[1.1]">
              Your growth partner
              <span className="font-instrument-serif text-white/30">
                {' '}
                with <br className="hidden lg:block" />
                AI expertise
              </span>
            </h2>
          </RevealAnimation>
          <RevealAnimation delay={0.4}>
            <p className="font-inter-tight text-tagline-2 mx-auto text-center font-normal text-white/60 lg:max-w-[482px]">
              Businesses trust Nexsas because of its proven ability to deliver data-driven insights
              that drive real results. With advanced AI technology, robust security protocols,
            </p>
          </RevealAnimation>
        </div>
        <AboutSwiper />
        <RevealAnimation delay={0.5}>
          <div className="flex justify-center">
            <PrimaryLinkButton href="/about" displayClassName="w-[85%] !py-[11px] sm:w-auto">
              Learn More
            </PrimaryLinkButton>
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

export default About;
