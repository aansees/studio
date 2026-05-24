import Link from "next/link";
import RevealAnimation from "@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation";
import { FooterBottom } from "./footer-bottom";
import { FooterContactForm } from "./footer-contact-form";
import { FooterLinkGroups } from "./footer-link-groups";

export function ClientFooter() {
  return (
    <footer className="bg-background-6 pt-[80px] pb-7 md:pt-[120px] xl:pt-[156px]">
      <div className="main-container">
        <RevealAnimation delay={0.1}>
          <div className="bg-background-6 space-y-16 overflow-hidden rounded-[30px] p-9">
            <RevealAnimation delay={0.2}>
              <div>
                <Link href="/" className="inline-block" aria-label="Ancs Studio home">
                  <span className="font-otis-display block text-[38px] leading-none text-white sm:text-[46px]">
                    Ancs Studio
                  </span>
                </Link>
              </div>
            </RevealAnimation>

            <div className="grid grid-cols-12 gap-y-8 lg:gap-0">
              <FooterLinkGroups />
              <FooterContactForm />
            </div>

            <FooterBottom />
          </div>
        </RevealAnimation>
      </div>
    </footer>
  );
}
