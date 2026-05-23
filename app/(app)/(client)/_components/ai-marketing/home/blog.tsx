import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';
import { SecondaryLinkButton } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/button/secondary-link-button';
import BlogCard from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/card/blog-card';
import HoverActiveCardGroup from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/hover-active-card-group/hover-active-card-group';
import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import { getBlogPosts } from '@/app/(app)/(client)/_components/ai-marketing/utils/getBlogPosts';

const BLOG_LIMIT = 3;

const Blog = () => {
  const posts = getBlogPosts().slice(0, BLOG_LIMIT);
  const blogCards = posts.map((post) => ({
    img: post.image,
    date: post.date,
    tags: post.tags,
    title: post.title,
    href: `/blog/${post.slug}`,
  }));

  return (
    <section className="bg-background-7 py-14 md:py-24 lg:py-28 xl:py-36 2xl:py-44">
      <div className="main-container space-y-10 md:space-y-14">
        <div className="space-y-3 pb-3.5 text-center">
          <RevealAnimation delay={0.1}>
            <div className="flex items-center justify-center">
              <Badge badgeText="Blog" className="text-black" />
            </div>
          </RevealAnimation>
          <div className="space-y-1.5 md:space-y-3">
            <RevealAnimation delay={0.2}>
              <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 text-background-5 font-normal max-md:leading-[1.1]">
                Learn What&apos;s Working Now in <br className="hidden md:block" />
                <span className="font-instrument-serif text-background-13/30">AI Marketing</span>
              </h2>
            </RevealAnimation>
            <RevealAnimation delay={0.3}>
              <p className="text-tagline-2 text-background-13/60 font-normal">
                Playbooks, trends, and real tactics for ads, SEO, funnels, and automation—built for
                growth-focused teams.
              </p>
            </RevealAnimation>
          </div>
        </div>

        {/* for desktop  */}
        <HoverActiveCardGroup
          className={cn(
            'hidden items-start justify-center overflow-hidden max-lg:flex-wrap max-lg:gap-y-9 md:space-x-[30px] lg:flex'
          )}
        >
          {blogCards.map((card, i) => (
            <RevealAnimation key={card.href} delay={0.4 + i * 0.1}>
              <BlogCard card={card} />
            </RevealAnimation>
          ))}
        </HoverActiveCardGroup>

        {/* for mobile  */}
        <div
          className={cn(
            'flex items-start justify-center overflow-hidden max-lg:flex-wrap max-lg:gap-y-9 md:space-x-[30px] lg:hidden'
          )}
        >
          {blogCards.map((card, i) => (
            <RevealAnimation key={card.href} delay={0.4 + i * 0.1}>
              <BlogCard card={card} className={cn(i === 1 && 'w-full')} />
            </RevealAnimation>
          ))}
        </div>

        <RevealAnimation delay={0.1}>
          <div className="flex justify-center">
            <SecondaryLinkButton href="/blog" displayClassName="w-[85%] md:w-auto">
              Read Marketing Insights
            </SecondaryLinkButton>
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

export default Blog;
