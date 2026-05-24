import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';
import Image from 'next/image';

const clientLogosRow1 = [
  'scapic-with-black-text.svg',
  'notion-with-black-text.svg',
  'lattice-with-black-text.svg',
  'hotjar-with-black-text.svg',
  'discord-with-black-text.svg',
  'stripe-with-black-text.svg',
  'spotify-with-black-text.svg',
];

const clientLogosRow2 = [
  'outreach-with-black-text.svg',
  'asana-with-black-text.svg',
  'squarespace-with-black-text.svg',
];

const Clients = () => (
  <section className="pt-16 pb-16 md:pb-24 lg:pb-28 xl:pb-36 2xl:pt-18 2xl:pb-44">
    <div className="main-container space-y-10 sm:space-y-8 lg:space-y-18">
      <div className="space-y-1.5 text-center md:space-y-3">
        <RevealAnimation delay={0.1}>
          <div className="flex items-center justify-center pb-4">
              <Badge badgeText="Who we help" />
          </div>
        </RevealAnimation>
        <RevealAnimation delay={0.2}>
          <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 text-background-13/90 font-normal max-md:leading-[1.1]">
            Building digital tools for founders,
            <br className="hidden lg:block" />
            service teams, and growing companies.
          </h2>
        </RevealAnimation>
        <RevealAnimation delay={0.3}>
          <p className="text-tagline-2 text-background-13/60 font-normal">
            From public websites to internal platforms, we shape the product around your workflow,
            budget, and launch path.
          </p>
        </RevealAnimation>
      </div>
      <div className="md:space-y-8">
        <RevealAnimation delay={0.4}>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-6 md:gap-x-10 md:gap-y-8">
            {clientLogosRow1.map((name) => (
              <figure key={name} className="max-md:scale-85 max-sm:scale-70">
                <Image
                  src={`/images/icons/${name}`}
                  alt="clients"
                  width={120}
                  height={40}
                  className="w-fit object-contain"
                />
              </figure>
            ))}
          </div>
        </RevealAnimation>
        <RevealAnimation delay={0.5}>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-4 md:gap-x-10 md:gap-y-8">
            {clientLogosRow2.map((name) => (
              <figure key={name} className="max-md:scale-90 max-sm:scale-70">
                <Image
                  src={`/images/icons/${name}`}
                  alt="clients"
                  width={120}
                  height={40}
                  className="w-fit object-contain"
                />
              </figure>
            ))}
          </div>
        </RevealAnimation>
      </div>
    </div>
  </section>
);

export default Clients;
