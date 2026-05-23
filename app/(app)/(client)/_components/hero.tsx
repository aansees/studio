'use client';

import { TextReveal } from '@/components/animation/text-reveal-animation';
import HeroVideo from './hero-video';

export const Hero = () => {
  return (
    <section
      className="relative overflow-hidden pt-24 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-[200px]"
      aria-labelledby="hero-heading"
    >
      <div className="main-container relative z-4">
        <div className="space-y-14 md:space-y-16">
          <div className="space-y-10 md:space-y-14">
            {/* content */}
            <div className="space-y-3 text-center">
              <TextReveal instant>
                <h1
                  id="hero-heading"
                  className="font-sora text-sora-heading-3 md:text-sora-heading-2 lg:text-sora-heading-1 mx-auto w-full max-w-[1036px] font-normal max-md:leading-[110%]"
                >
                  <span className="text-white"> AI solutions</span>
                  <span className="text-white/30">
                    built for real <br className="hidden md:block" /> business impact
                  </span>
                </h1>
              </TextReveal>

              <TextReveal instant delay={0.2}>
                <p
                  className="font-inter-tight text-tagline-2 mx-auto w-full max-w-[450px] font-normal text-white/50"
                  aria-describedby="hero-heading"
                >
                  Streamline operations, elevate decision-making, and fuel growth with practical,
                  results-driven AI.
                </p>
              </TextReveal>
            </div>
          </div>
        </div>
      </div>

      {/* hero gradient video background */}
      <HeroVideo />

      {/* overlays */}
      <div
        className="to-background-7 pointer-events-none absolute -bottom-10 left-0 z-20 h-[184px] w-full bg-linear-to-b from-transparent from-[10.09%] to-[89.05%] select-none"
        aria-hidden
      />
      <div
        className="to-background-7 pointer-events-none absolute -bottom-12 left-0 z-19 h-[104px] w-full bg-linear-to-b from-transparent from-[10.09%] to-[69.05%] select-none"
        aria-hidden
      />
      <div
        className="to-background-7 pointer-events-none absolute -bottom-2 left-0 z-18 h-10 w-full bg-linear-to-b from-transparent from-[10.09%] to-[55.05%] select-none"
        aria-hidden
      />
    </section>
  );
};

export default Hero;
