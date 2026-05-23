import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';
import { TestimonialMarquee } from '@/app/(app)/(client)/_components/ai-marketing/shared/testimonial-marquee';
import GradientImg from '@/app/(app)/(client)/_components/ai-marketing/home/gradient-img';

const Testimonial = () => (
  <section className="bg-background-5 relative overflow-hidden pt-14 pb-14 md:pt-22 md:pb-28 lg:pt-28 lg:pb-36 xl:pb-40 2xl:pb-44">
    <div className="main-container relative z-10 mb-10 md:mb-17.5">
      <div className="space-y-4 text-center">
        <RevealAnimation delay={0.1}>
          <div className="flex items-center justify-center">
            <Badge badgeText="Testimonial" className="text-white/50" />
          </div>
        </RevealAnimation>
        <RevealAnimation delay={0.2}>
          <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 font-normal text-white max-md:leading-[1.1]">
            What Our Clients Are Saying.
          </h2>
        </RevealAnimation>
      </div>
    </div>
    <TestimonialMarquee />
    <GradientImg
      imagePath="/images/gradient/opai-2.png"
      className="absolute bottom-0 left-0 z-4 h-[496px] w-full min-[2000px]:bottom-0 md:-bottom-[2%] md:h-[540px] lg:h-[696px] 2xl:h-[796px]"
    />
  </section>
);

export default Testimonial;
