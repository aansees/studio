import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import AvatarItem from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/avatar-reveal/avatar-item';
import AvatarReveal from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/avatar-reveal/avatar-reveal';
import { PrimaryLinkButton } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/button/primary-link-button';
import Image from 'next/image';
import AnimateGradient from './animate-gradient';
import GradientImg from './gradient-img';
import HeroPill, { heroPills } from './hero-pill';

const avatars = [
  '/images/opai-avatar-img-01.png',
  '/images/opai-avatar-img-02.png',
  '/images/opai-avatar-img-03.png',
  '/images/opai-avatar-img-04.png',
];

const Hero = () => (
  <section className="bg-background-5 relative overflow-hidden pt-[150px] pb-16 md:pb-24 lg:pt-[200px] lg:pb-28 xl:pt-[220px] xl:pb-36 2xl:pb-44">
    <div className="main-container relative z-20">
      <div className="space-y-1.5 text-center md:space-y-3">
        <RevealAnimation delay={0.1}>
          <h1 className="text-is-heading-3 md:text-is-heading-2 lg:text-is-heading-1 font-normal text-white/90 max-md:leading-[1.1]">
            Intelligent, community-focused &
            <br className="hidden lg:block" />
            AI-powered marketing
          </h1>
        </RevealAnimation>
        <RevealAnimation delay={0.2}>
          <p className="text-tagline-2 font-normal text-white/60">
            Your trusted local digital marketing agency, powered by data and AI.
            <br className="hidden lg:block" />
            We help businesses grow traffic, leads, and revenue faster.
          </p>
        </RevealAnimation>
      </div>
      <div className="space-y-8 pt-13 lg:pt-18">
        <RevealAnimation delay={0.3}>
          <div className="flex justify-center">
            <PrimaryLinkButton href="/about" displayClassName="w-[80%] sm:w-auto">
              Learn more
            </PrimaryLinkButton>
          </div>
        </RevealAnimation>
        <div className="flex items-center justify-center gap-4 max-[375px]:flex-col">
          <AvatarReveal
            className="flex -space-x-2.5"
            direction="left"
            stagger={0.08}
            markers={false}
          >
            {avatars.map((src, i) => (
              <AvatarItem key={src} className="inline-block shrink-0">
                <Image
                  src={src}
                  alt={`Avatar ${i + 1}`}
                  width={36}
                  height={36}
                  className="inline-block size-9 rounded-full object-cover ring-2 ring-white"
                />
              </AvatarItem>
            ))}
            <AvatarItem>
              <div className="text-tagline-4 inline-flex size-9 items-center justify-center rounded-full bg-[#0d0d1280] font-medium text-white/80 ring-2 ring-white backdrop-blur-[6px]">
                99+
              </div>
            </AvatarItem>
          </AvatarReveal>
          <RevealAnimation delay={0.4}>
            <div className="text-left max-[375px]:text-center">
              <p className="text-tagline-3 block font-medium text-white/90">Trusted by 20k+</p>
              <p className="text-tagline-4 text-white/60">Customers across the globe</p>
            </div>
          </RevealAnimation>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1 pt-10 sm:gap-4 md:pt-17 lg:pt-30">
        {heroPills.map((item, i) => (
          <RevealAnimation key={item.title} delay={0.1 + i * 0.1}>
            <HeroPill src={item.src} title={item.title} href={item.href} />
          </RevealAnimation>
        ))}
      </div>
    </div>
    <figure className="absolute bottom-0 left-1/2 z-0 size-full max-w-[1390px] -translate-x-1/2 md:-bottom-10 lg:bottom-0">
      <AnimateGradient />
    </figure>
    <GradientImg
      imagePath="/images/gradient/opai-2.png"
      className="absolute bottom-0 left-0 z-4 h-[696px] w-full min-[2000px]:bottom-0 md:-bottom-4 md:h-[540px] lg:h-[796px] 2xl:h-[796px]"
    />
  </section>
);

export default Hero;
