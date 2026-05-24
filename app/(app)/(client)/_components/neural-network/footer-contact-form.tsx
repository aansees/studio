import Link from "next/link";
import RevealAnimation from "@/app/(app)/(client)/_components/ai-marketing/animation/reveal-animation";
import { SubmitButtonV2 } from "./submit-button-v2";

export function FooterContactForm() {
  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="space-y-8">
        <div className="space-y-4">
          <RevealAnimation delay={0.3}>
            <div className="space-y-1">
              <p className="font-inter-tight text-tagline-2 text-background-11 font-semibold">
                Address:
              </p>
              <p className="font-inter-tight text-tagline-3 font-normal text-white/50">
                Kathmandu, Nepal. Remote delivery for clients worldwide.
              </p>
            </div>
          </RevealAnimation>
          <RevealAnimation delay={0.4}>
            <div>
              <p className="font-inter-tight text-tagline-2 text-background-11 mb-1 font-semibold">
                Contact:
              </p>
              <p className="font-inter-tight text-tagline-3 font-normal text-white/50">
                Project inquiries and support
              </p>
              <p className="font-inter-tight text-tagline-3 font-normal text-white/50">
                hello@ancsstudio.com
              </p>
            </div>
          </RevealAnimation>
        </div>
        <RevealAnimation delay={0.5}>
          <div className="space-y-3">
            <form action="#" className="mx-auto w-full max-w-[550px] space-y-[9px] lg:mx-0 lg:max-w-full">
              <fieldset>
                <input
                  type="email"
                  name="email"
                  aria-label="Enter your email"
                  placeholder="Enter your email"
                  required
                  className="border-stroke-3/30 bg-background-6 placeholder:text-tagline-3 text-background-8 text-tagline-3 block h-13 w-full rounded-md border px-3 py-[11px] font-normal placeholder:font-normal placeholder:text-white/60 focus:outline-none"
                />
              </fieldset>
              <div className="w-full">
                <SubmitButtonV2
                  innerClassName="!rounded-md !bg-background-7 !text-background-13"
                  iconClassName="!rounded-sm"
                  buttonTextClassName="!text-background-13"
                >
                  Send inquiry
                </SubmitButtonV2>
              </div>
            </form>
            <p className="font-inter-tight text-tagline-4 font-normal text-white/60">
              By contacting us you agree to our{" "}
              <Link href="#" className="font-medium text-white hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </RevealAnimation>
      </div>
    </div>
  );
}
