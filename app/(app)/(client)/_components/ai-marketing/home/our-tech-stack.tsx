import RevealAnimation from '@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation';
import { Badge } from '@/app/(app)/(client)/_components/ai-marketing/shared/ui/badge';

const OurTechStack = () => (
  <section className="bg-[#f8fafb] pt-16 pb-16 md:pt-24 md:pb-28 lg:pt-28 lg:pb-36 xl:pt-36 xl:pb-44 2xl:pt-44">
    <div className="md:main-container">
      <RevealAnimation delay={0.1}>
        <div className="flex items-center justify-center pb-4">
          <Badge badgeText="Our Tech Stack" className="text-black" />
        </div>
      </RevealAnimation>
      <div className="relative z-40 mx-auto h-[240px] w-full max-w-[960px] overflow-hidden md:h-[322px]">
        <div className="absolute -top-7 left-[5%] z-2 h-10 w-full bg-linear-[0deg,#f8fafb_0%,#f8fafb_100%] blur-[5px]" />
        <div className="relative z-5 space-y-1.5 text-center md:space-y-3">
          <RevealAnimation delay={0.2}>
            <h2 className="text-is-heading-4 md:text-is-heading-3 lg:text-is-heading-2 text-background-5 font-normal max-md:leading-[1.1]">
              Built on Top AI + <span className="text-background-13/30">Marketing Tools</span>
            </h2>
          </RevealAnimation>
          <RevealAnimation delay={0.3}>
            <p className="text-tagline-2 text-background-13/60 font-normal">
              We blend automation with human creativity.
            </p>
          </RevealAnimation>
        </div>
        <div className="integration-circle-animation absolute bottom-[6%] left-1/2 w-[800px] -translate-x-1/2 md:w-[899px]">
          <svg viewBox="-30 -30 1520 1520" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
            <circle cx="740" cy="744" r="699.5" stroke="#7c8ea500" />
            {/* gemini - top (0°) */}
            <g transform="translate(703.03 -15.98)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/gemini.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* lovable - top-right */}
            <g transform="translate(888.53 12.45)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/lovable.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* claude ai - right */}
            <g transform="translate(1063.35 84.09)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/claude-ai.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* qwen - right-bottom */}
            <g transform="translate(1213.66 197.94)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/qwen.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* deepseek - bottom-right */}
            <g transform="translate(1331.15 346.90)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/deepseek.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* runway - bottom-right */}
            <g transform="translate(1397.50 521.65)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/runway.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* chatgpt - bottom */}
            <g transform="translate(1422.97 706.92)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/open-ai.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* mistral ai - bottom */}
            <g transform="translate(1398.06 892.35)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/mistral-ai.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* grok - bottom-left */}
            <g transform="translate(1332.07 1069.69)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/grok-ai.svg" x="20" y="20" width="32" height="32" />
            </g>
            {/* perplexity - left-bottom */}
            <g transform="translate(1210.65 1217.23)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/perplexity-ai.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* google ads certified - left */}
            <g transform="translate(1062.19 1329.57)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/google-ads-certified.png" x="18.6" y="18.6" width="34.83" height="34.83" />
            </g>
            {/* github - left-top */}
            <g transform="translate(890.99 1406.55)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/github.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* gemini - bottom */}
            <g transform="translate(702.92 1422.97)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/gemini.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* lovable - left-top */}
            <g transform="translate(514.96 1399.24)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/lovable.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* claude ai - left */}
            <g transform="translate(343.34 1330.62)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/claude-ai.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* qwen - left-bottom */}
            <g transform="translate(193.41 1216.12)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/qwen.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* deepseek - top-left */}
            <g transform="translate(78.57 1066.82)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/deepseek.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* runway - top-left */}
            <g transform="translate(12.96 894.04)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/runway.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* chatgpt - top */}
            <g transform="translate(-15.97 700.86)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/open-ai.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* mistral ai - top */}
            <g transform="translate(13.42 522.21)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/mistral-ai.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* grok - top-left */}
            <g transform="translate(79.40 347.77)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/grok-ai.svg" x="20" y="20" width="32" height="32" />
            </g>
            {/* perplexity - top-left */}
            <g transform="translate(194.39 199.26)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/perplexity-ai.svg" x="17" y="17" width="38" height="38" />
            </g>
            {/* google ads certified - top-left */}
            <g transform="translate(344.26 84.24)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/google-ads-certified.png" x="18.6" y="18.6" width="34.83" height="34.83" />
            </g>
            {/* github - top-right */}
            <g transform="translate(517.60 16.87)">
              <circle cx="36" cy="36" r="32" fill="#e4eaee" stroke="#f1f4f6" strokeWidth="4" />
              <image href="/images/icons/github.svg" x="17" y="17" width="38" height="38" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  </section>
);

export default OurTechStack;
