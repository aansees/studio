import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';
import { SecondaryLinkButton } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/button/secondary-link-button';
import CardReveal from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/card-reveal-on-scroll/card-reveal';
import CardRevealItem from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/card-reveal-on-scroll/card-reveal-item';
import CaseStudyCard from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/card/case-study-card';
import { getCaseStudies } from '@/app/(app)/(client)/_components/ai-marketing/utils/getCaseStudies';

const CASE_STUDY_LIMIT = 4;
const DEFAULT_STATS = [{ value: 0, suffix: '%', label: 'Impact' }];

const CaseStudy = () => {
  const studies = getCaseStudies().slice(0, CASE_STUDY_LIMIT).reverse();
  return (
    <section className="bg-white py-16 md:py-24 lg:py-28 xl:py-36 2xl:py-44">
      <div className="main-container">
        <div className="space-y-12 md:space-y-20">
          <div className="space-y-1.5 text-center md:space-y-6">
            <RevealAnimation delay={0.1}>
              <div className="flex items-center justify-center">
                <Badge badgeText="Case Studies" className="text-black" />
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.2}>
              <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 text-background-13 font-normal max-md:leading-[1.1]">
                Project outcomes that show the work.
              </h2>
            </RevealAnimation>
          </div>
          <CardReveal className="grid grid-cols-12 gap-y-8 md:gap-y-14 lg:gap-y-20">
            {studies?.map((study) => (
              <CardRevealItem key={study.slug} className="col-span-12">
                <CaseStudyCard
                  img={study.image}
                  title={study.title}
                  desc={study.excerpt}
                  href={`/case-study/${study.slug}`}
                  stats={study.stats?.length ? study.stats : DEFAULT_STATS}
                />
              </CardRevealItem>
            ))}
          </CardReveal>
          <RevealAnimation delay={0.1}>
            <div className="flex justify-center">
              <SecondaryLinkButton href="/start-project">Plan a project</SecondaryLinkButton>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

export default CaseStudy;
