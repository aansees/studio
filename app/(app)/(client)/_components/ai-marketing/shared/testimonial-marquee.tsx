import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { TestimonialStarIcon } from '@/app/(app)/(client)/_components/ai-marketing/shared/icon';
import Image from 'next/image';
import Marquee from 'react-fast-marquee';

const testimonialsData = [
  {
    quote:
      'ANCS Studio helped us turn a scattered internal process into a clean web application our team actually uses every day.',
    name: 'Lena Torres',
    role: 'Operations Director',
    avatar: '/images/opai-avatar-img-01.png',
  },
  {
    quote:
      'The planning was clear, the communication was direct, and the final dashboard gave us the visibility we were missing.',
    name: 'Maya Chen',
    role: 'Founder, Service Company',
    avatar: '/images/opai-avatar-img-02.png',
  },
  {
    quote:
      'They understood the business problem before writing code. That made the website and booking flow much stronger.',
    name: 'Derek Singh',
    role: 'Head of Product',
    avatar: '/images/opai-avatar-img-03.png',
  },
  {
    quote:
      'We went from a rough idea to a working client portal without losing weeks in unclear meetings or shifting scope.',
    name: 'Laura Fernandez',
    role: 'Project Lead',
    avatar: '/images/opai-avatar-img-04.png',
  },
  {
    quote:
      'The best part was how practical the team was. They built what we needed now and left room to grow later.',
    name: 'Jonas Muller',
    role: 'Growth Manager',
    avatar: '/images/opai-avatar-img-05.png',
  },
  {
    quote:
      'Our app launch felt organized from start to finish. The handoff, fixes, and follow-up support were handled professionally.',
    name: 'Priya Singh',
    role: 'Business Owner',
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
