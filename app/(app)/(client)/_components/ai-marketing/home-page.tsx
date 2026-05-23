import About from "./home/about";
import Blog from "./home/blog";
import CaseStudy from "./home/case-study";
import Clients from "./home/clients";
import Hero from "./home/hero";
import OurProcess from "./home/our-process";
import OurTechStack from "./home/our-tech-stack";
import PartnerShips from "./home/partner-ships";
import Services from "./home/services";
import Testimonial from "./home/testimonial";
import WhyChooseUs from "./home/why-choose-us";
import CTA from "./shared/cta";
import { getServices } from "./utils/getServices";

export default function AiMarketingHomePage() {
  const services = getServices();

  return (
    <main className="bg-background-7">
      <Hero />
      <Clients />
      <Services services={services} />
      <WhyChooseUs />
      <OurTechStack />
      <CaseStudy />
      <About />
      <OurProcess />
      <Testimonial />
      <PartnerShips />
      <Blog />
      <CTA className="pt-20! md:pt-30! lg:pt-44!" />
    </main>
  );
}
