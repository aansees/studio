import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { TestimonialStarIcon } from '@/app/(app)/(client)/_components/ai-marketing/shared/icon';
import Image from 'next/image';
import Marquee from 'react-fast-marquee';

const testimonialsData = [
  {
    quote:
      'Committed, innovative, and results-oriented—exactly what we needed. Their creative strategies consistently introduce new concepts. With a deep dedication to quality.',
    name: 'Lena Torres',
    role: 'CMO',
    avatar: '/images/opai-avatar-img-01.png',
  },
  {
    quote:
      "The team's expertise and hands-on approach made the entire integration seamless and surprisingly fast. Highly recommend!",
    name: 'Maya Chen',
    role: 'CTO, Fintech Innovators',
    avatar: '/images/opai-avatar-img-02.png',
  },
  {
    quote:
      'From day one, Nexsas felt like an extension of our internal team. Their tools and support are truly next-level.',
    name: 'Derek Singh',
    role: 'Head of Product, E-commerce Platform',
    avatar: '/images/opai-avatar-img-03.png',
  },
  {
    quote:
      'We went from idea to execution in weeks—not months. The automation is saving us countless hours every month.',
    name: 'Laura Fernandez',
    role: 'Operations Lead, SaaS Company',
    avatar: '/images/opai-avatar-img-04.png',
  },
  {
    quote:
      'What impressed me most was the flexibility. Nexsas adapted to our workflow instead of forcing us to change.',
    name: 'Jonas Müller',
    role: 'Growth Manager, Logistics Startup',
    avatar: '/images/opai-avatar-img-05.png',
  },
  {
    quote:
      'The onboarding was seamless and the team was incredibly responsive. Now, our marketing runs smoother and results are up by 33%!',
    name: 'Priya Singh',
    role: 'Marketing Director, E-Commerce Brand',
    avatar: '/images/opai-avatar-img-06.png',
  },
];

const TestimonialMarquee = () => (
  <div className="gradient-hidden">
    <RevealAnimation delay={0.3}>
      <div className="relative z-20">
        <Marquee
          speed={40}
          direction="left"
          pauseOnHover
          autoFill
          gradient={false}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-8 pr-8">
            {testimonialsData.map((t) => (
              <div
                key={t.name}
                className="relative flex min-h-[329px] w-[320px] flex-col items-center rounded-lg bg-white px-4 pt-8 pb-8 md:min-h-[370px] md:w-[332px] md:px-8 md:pt-14"
              >
                <div className="max-h-full space-y-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TestimonialStarIcon className="size-4 fill-black!" />
                  </div>
                  <p className="text-tagline-2 text-background-13/60 font-normal text-wrap">
                    {t.quote}
                  </p>
                </div>
                <div className="absolute bottom-4 left-1/2 mt-[5px] -translate-x-1/2 space-y-2 text-center md:bottom-6">
                  <figure className="mx-auto size-12 overflow-hidden rounded-full">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={48}
                      height={48}
                      className="size-full object-cover grayscale-25"
                    />
                  </figure>
                  <blockquote className="space-y-0.5">
                    <h3 className="text-is-heading-6 text-background-6 font-normal">{t.name}</h3>
                    <p className="text-tagline-3 text-background-13/60 font-normal">{t.role}</p>
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </Marquee>
      </div>
    </RevealAnimation>
  </div>
);

export { TestimonialMarquee };
