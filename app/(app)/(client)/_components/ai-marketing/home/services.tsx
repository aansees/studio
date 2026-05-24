import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';
import { PrimaryLinkButton } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/button/primary-link-button';
import ServiceCard from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/card/service-card';
import ImageReveal from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/image-reveal-on-hover/image-reveal';
import RevealItem from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/image-reveal-on-hover/reveal-item';
import type { ServiceItem } from '@/app/(app)/(client)/_components/ai-marketing/data/services';

const Services = ({ services }: { services: ServiceItem[] }) => {
  return (
    <section className="bg-background-5 py-16 md:py-24 lg:py-28 xl:py-36 2xl:py-44">
      <div className="main-container">
        <div className="grid grid-cols-1 gap-y-14 lg:grid-cols-2 lg:gap-x-20">
          <div className="space-y-1.5 md:space-y-3 lg:max-w-[514px]">
            <RevealAnimation delay={0.1}>
              <div className="pb-4">
                <Badge badgeText="What we build" className="text-white/60" />
              </div>
            </RevealAnimation>

            <RevealAnimation delay={0.2}>
              <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 text-center font-normal text-white/90 lg:text-left">
                Practical software services for growing teams
              </h2>
            </RevealAnimation>

            <RevealAnimation delay={0.3}>
              <p className="text-tagline-2 text-center font-normal text-white/60 lg:text-left">
                Websites, web apps, dashboards, booking systems, mobile apps, and automation
                delivered with clean design and maintainable engineering.
              </p>
            </RevealAnimation>

            <RevealAnimation delay={0.4}>
              <div className="pt-8 md:pt-18">
                <PrimaryLinkButton
                  href="/start-project"
                  displayClassName="mx-auto w-[85%] sm:w-fit lg:mx-0"
                >
                  Discuss a build
                </PrimaryLinkButton>
              </div>
            </RevealAnimation>
          </div>

          <ImageReveal
            className="relative"
            cursorClassName="h-[260px] w-[220px] lg:h-[320px] lg:w-[260px]"
          >
            <div className="divide-stroke-1/11 divide-y">
              {services.map((service, index) => (
                <RevealAnimation key={service.title} delay={0.2 + index * 0.1} instant>
                  <RevealItem image={service.image}>
                    <ServiceCard
                      iconClass={service.iconClass}
                      title={service.title}
                      description={service.description}
                      href={service.href}
                    />
                  </RevealItem>
                </RevealAnimation>
              ))}
            </div>
          </ImageReveal>
        </div>
      </div>
    </section>
  );
};
export default Services;
