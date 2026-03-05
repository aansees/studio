"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const slideUp = {
  initial: { y: "100%", opacity: 0 },
  open: (i: number) => ({
    y: "0%",
    opacity: 1,
    transition: {
      duration: 0.6,
      delay: 0.05 * i,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  }),
  closed: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  },
};

const fadeIn = {
  initial: { opacity: 0, y: 40 },
  open: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: 0.3 + 0.1 * i,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  }),
  closed: {
    opacity: 0,
    y: 40,
    transition: {
      duration: 0.4,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  },
};

const services = [
  {
    title: "Brand Strategy",
    description:
      "We define and position your brand to resonate with the right audience through research-driven strategy.",
  },
  {
    title: "UI/UX Design",
    description:
      "Crafting intuitive, beautiful interfaces that delight users and drive meaningful engagement.",
  },
  {
    title: "Web Development",
    description:
      "Building high-performance, scalable web applications with cutting-edge technology and clean code.",
  },
  {
    title: "Creative Direction",
    description:
      "Shaping a cohesive visual narrative across every touchpoint — from concept to final delivery.",
  },
];

const stats = [
  { value: "50+", label: "Projects Delivered" },
  { value: "8+", label: "Years Experience" },
  { value: "30+", label: "Happy Clients" },
  { value: "100%", label: "Passion Driven" },
];

const About = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const servicesRef = useRef(null);
  const statsRef = useRef(null);

  const isHeadingInView = useInView(headingRef, {
    once: true,
    margin: "-100px",
  });
  const isServicesInView = useInView(servicesRef, {
    once: true,
    margin: "-80px",
  });
  const isStatsInView = useInView(statsRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 rounded-t-[4rem] md:rounded-t-[8rem] bg-neutral-900 "
      aria-label="About section"
    >
      <div className="main-container py-24 md:py-32 lg:py-40">
        {/* Heading area */}
        <div ref={headingRef} className="mb-20 md:mb-28 lg:mb-36">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 md:gap-16">
            {/* Left: Label + Heading */}
            <div className="flex-1">
              <div className="overflow-hidden mb-4">
                <motion.span
                  className="inline-block text-xs md:text-sm uppercase tracking-[0.3em] text-muted-foreground font-sans"
                  variants={slideUp}
                  custom={0}
                  initial="closed"
                  animate={isHeadingInView ? "open" : "closed"}
                >
                  About Us
                </motion.span>
              </div>

              <div className="flex flex-col -space-y-2 md:-space-y-3">
                {[
                  "We craft digital",
                  "experiences with",
                  "purpose & soul.",
                ].map((line, i) => (
                  <div key={i} className="overflow-hidden">
                    <motion.h2
                      className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-editorial leading-[1.1] tracking-tight"
                      variants={slideUp}
                      custom={i + 1}
                      initial="closed"
                      animate={isHeadingInView ? "open" : "closed"}
                    >
                      {line.includes("&") ? (
                        <>
                          {line.split("&")[0]}
                          <span className="font-great-vibes">&</span>
                          {line.split("&")[1]}
                        </>
                      ) : (
                        line
                      )}
                    </motion.h2>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Description paragraph */}
            <div className="md:max-w-md lg:max-w-lg">
              <motion.p
                className="text-sm md:text-base lg:text-lg text-muted-foreground font-editorial leading-relaxed"
                variants={fadeIn}
                custom={0}
                initial="closed"
                animate={isHeadingInView ? "open" : "closed"}
              >
                We&apos;re a tight-knit studio of designers and developers who
                believe that great digital products sit at the intersection of
                strategy, aesthetics, and technical excellence. Every project we
                take on is an opportunity to push boundaries and create
                something truly memorable.
              </motion.p>
              <motion.p
                className="text-sm md:text-base lg:text-lg text-muted-foreground font-editorial leading-relaxed mt-4"
                variants={fadeIn}
                custom={1}
                initial="closed"
                animate={isHeadingInView ? "open" : "closed"}
              >
                No templates, no shortcuts — just thoughtful craft from concept
                to code.
              </motion.p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div ref={servicesRef} className="mb-20 md:mb-28 lg:mb-36">
          <div className="overflow-hidden mb-10 md:mb-14">
            <motion.span
              className="inline-block text-xs md:text-sm uppercase tracking-[0.3em] text-muted-foreground font-sans"
              variants={slideUp}
              custom={0}
              initial="closed"
              animate={isServicesInView ? "open" : "closed"}
            >
              What We Do
            </motion.span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                className="bg-background p-8 md:p-10 lg:p-12 group cursor-default"
                variants={fadeIn}
                custom={i}
                initial="closed"
                animate={isServicesInView ? "open" : "closed"}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-editorial leading-tight group-hover:text-primary transition-colors duration-300">
                    {service.title}
                  </h3>
                  <span className="text-xs text-muted-foreground font-sans mt-2 ml-4 shrink-0">
                    0{i + 1}
                  </span>
                </div>
                <p className="text-sm md:text-base text-muted-foreground font-editorial leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div ref={statsRef}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                variants={fadeIn}
                custom={i}
                initial="closed"
                animate={isStatsInView ? "open" : "closed"}
              >
                <div className="text-4xl md:text-5xl lg:text-6xl font-editorial leading-none mb-2 text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
