import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import GradientImg from '@/app/(app)/(client)/_components/ai-marketing/home/gradient-img';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';
import WhyChooseUsCard from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/card/why-choose-us-card';
import { StairCard } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/stair-cards/stair-card';
import { StairCards } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/stair-cards/stair-cards';
import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';

const cards = [
  { shapeClass: 'ns-shape-7', title: 'Business-first planning before code' },
  { shapeClass: 'ns-shape-8', title: 'Web apps and software built to scale' },
  { shapeClass: 'ns-shape-9', title: 'Transparent delivery with clear milestones' },
  { shapeClass: 'ns-shape-10', title: 'Long-term support after launch' },
];

const WhyChooseUs = () => (
  <section className="bg-background-5 relative -my-0.5 overflow-hidden py-16 md:py-24 lg:py-28 xl:py-36 2xl:py-44">
    <div className="main-container relative z-20 space-y-12 md:space-y-17.5">
      <div className="flex flex-col gap-y-1.5 md:gap-y-14 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5 md:space-y-6">
          <RevealAnimation delay={0.1}>
            <div className="max-md:pb-3">
              <Badge
                badgeText="Why Choose Us"
                className="justify-center text-white/50 lg:justify-start"
              />
            </div>
          </RevealAnimation>
          <RevealAnimation delay={0.2}>
            <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 text-center font-normal text-white max-md:leading-[1.1] lg:text-left">
              Why teams choose <br className="hidden lg:block" />
              ANCS Studio
            </h2>
          </RevealAnimation>
        </div>
        <RevealAnimation delay={0.3}>
          <p className="font-inter-tight text-tagline-2 text-center font-normal text-white/60 lg:max-w-[402px] lg:text-right">
            We do not start with templates or vague promises. We clarify the problem, define the
            product, build the right pieces, and keep communication direct from kickoff to launch.
          </p>
        </RevealAnimation>
      </div>
      <StairCards className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <StairCard key={card.title}>
            <WhyChooseUsCard
              {...card}
              className={cn(
                index === 0 && 'lg:rounded-l-lg',
                index === cards.length - 1 && 'lg:rounded-r-lg'
              )}
            />
          </StairCard>
        ))}
      </StairCards>
    </div>

    <GradientImg
      imagePath="/images/gradient/opai-2.png"
      className="absolute -bottom-[11%] left-0 z-4 h-[596px] w-full min-[2000px]:bottom-0 md:-bottom-[15%] md:h-[540px] lg:bottom-[0%] lg:h-[696px] 2xl:h-[796px]"
    />
  </section>
);

export default WhyChooseUs;
