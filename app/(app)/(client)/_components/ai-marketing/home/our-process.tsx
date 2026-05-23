import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';

const steps = [
  { num: '1', title: 'Free Consultation & Audit', desc: 'Create your account and explore with a 7-day free trial.' },
  { num: '2', title: 'AI-Driven Strategy', desc: 'Co-build a roadmap that blends predictive insights with human creativity.' },
  { num: '3', title: 'Launch, Test, and Optimize', desc: 'Deploy experiences, run iterative experiments, and scale what works.' },
  { num: '4', title: 'Monthly Reports & Growth', desc: 'Stay in the loop with transparent reporting and optimization insights.' },
];

const numberClass =
  'text-is-heading-3 md:text-is-heading-2 lg:text-is-heading-1 webkit-bg-clip-text bg-linear-[180deg,#FFF_0%,rgba(18,32,31,0.00)_100%] bg-clip-text font-normal text-transparent';

const OurProcess = () => (
  <section className="bg-background-5 -my-0.5 py-14 md:py-24 lg:py-28 xl:py-36 2xl:py-44">
    <div className="main-container space-y-10 md:space-y-20">
      <div className="space-y-4">
        <RevealAnimation delay={0.1}>
          <Badge badgeText="Our Process" className="justify-start text-white/50" />
        </RevealAnimation>
        <RevealAnimation delay={0.2}>
          <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 font-normal text-white max-md:leading-[1.1]">
            How we <span className="font-instrument-serif text-white/30"> work</span>
          </h2>
        </RevealAnimation>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <RevealAnimation key={step.num} delay={0.3 + i * 0.1}>
            <div>
              <h2 className={numberClass}>{step.num}</h2>
              <h3 className="text-is-heading-5 -mt-1 font-normal text-white lg:mb-2">{step.title}</h3>
              <p className="text-tagline-2 font-inter-tight text-white/60 lg:max-w-[260px]">{step.desc}</p>
            </div>
          </RevealAnimation>
        ))}
      </div>
    </div>
  </section>
);

export default OurProcess;
