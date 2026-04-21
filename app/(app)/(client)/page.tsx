"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import AnimatedButton from "./_components/animated-button/animated-button";
import FeaturedProjects from "./_components/featured-projects/featured-projects";
// import ClientReviews from "./_components/client-reviews/client-reviews";
import Copy from "./_components/copy/copy";

function shouldShowHomePreloader() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const navigationEntry =
      performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;

    if (!navigationEntry?.name) {
      return true;
    }

    const initialDocumentUrl = new URL(navigationEntry.name);
    return initialDocumentUrl.pathname === window.location.pathname;
  } catch {
    return true;
  }
}

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");

export default function HomePage() {
  const tagsRef = useRef<HTMLDivElement>(null);
  const [showPreloader, setShowPreloader] = useState(false);
  const [useIntroHeroTiming, setUseIntroHeroTiming] = useState(false);
  const [loaderAnimating, setLoaderAnimating] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const shouldShow = shouldShowHomePreloader();
    setShowPreloader(shouldShow);
    setUseIntroHeroTiming(shouldShow);
  }, []);

  useEffect(() => {
    if (!lenis) {
      return;
    }

    if (loaderAnimating) {
      lenis.stop();
      return;
    }

    lenis.start();
  }, [lenis, loaderAnimating]);

  useGSAP(() => {
    const tl = gsap.timeline({
      delay: 0.3,
      defaults: {
        ease: "hop",
      },
    });

    if (showPreloader) {
      setLoaderAnimating(true);
      const counts = document.querySelectorAll(".count");

      counts.forEach((count, index) => {
        const digits = count.querySelectorAll(".digit h1");

        tl.to(
          digits,
          {
            y: "0%",
            duration: 1,
            stagger: 0.075,
          },
          index * 1,
        );

        tl.to(
          digits,
          {
            y: "-100%",
            duration: 1,
            stagger: 0.075,
          },
          index * 1 + 1,
        );
      });

      tl.to(".spinner", {
        opacity: 0,
        duration: 0.3,
      });

      tl.to(
        ".word h1",
        {
          y: "0%",
          duration: 1,
        },
        "<",
      );

      tl.to(".divider", {
        scaleY: "100%",
        duration: 1,
        onComplete: () => {
          gsap.to(".divider", { opacity: 0, duration: 0.3, delay: 0.3 });
        },
      });

      tl.to("#word-1 h1", {
        y: "100%",
        duration: 1,
        delay: 0.3,
      });

      tl.to(
        "#word-2 h1",
        {
          y: "-100%",
          duration: 1,
        },
        "<",
      );

      tl.to(
        ".block",
        {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          duration: 1,
          stagger: 0.1,
          delay: 0.75,
          onStart: () => {
            gsap.to(".hero-img", { scale: 1, duration: 2, ease: "hop" });
          },
          onComplete: () => {
            gsap.set(".loader", { pointerEvents: "none" });
            setLoaderAnimating(false);
            setShowPreloader(false);
          },
        },
        "<",
      );
    }
  }, [showPreloader]);

  useGSAP(
    () => {
      if (!tagsRef.current) {
        return;
      }

      const tags = tagsRef.current.querySelectorAll(".what-we-do-tag");
      gsap.set(tags, { opacity: 0, x: -40 });

      ScrollTrigger.create({
        trigger: tagsRef.current,
        start: "top 90%",
        once: true,
        animation: gsap.to(tags, {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
        }),
      });
    },
    { scope: tagsRef },
  );

  const heroTitleDelay = useIntroHeroTiming ? 10 : 0.85;
  const heroTaglineDelay = useIntroHeroTiming ? 10.15 : 1;
  const heroButtonDelay = useIntroHeroTiming ? 10.3 : 1.15;

  return (
    <>
      {showPreloader ? (
        <div className="loader">
          <div className="overlay">
            <div className="block"></div>
            <div className="block"></div>
          </div>
          <div className="intro-logo">
            <div className="word" id="word-1">
              <h1>
                <span>ancs</span>
              </h1>
            </div>
            <div className="word" id="word-2">
              <h1>studio</h1>
            </div>
          </div>
          <div className="divider"></div>
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
          <div className="counter">
            <div className="count">
              <div className="digit">
                <h1>0</h1>
              </div>
              <div className="digit">
                <h1>0</h1>
              </div>
            </div>
            <div className="count">
              <div className="digit">
                <h1>2</h1>
              </div>
              <div className="digit">
                <h1>7</h1>
              </div>
            </div>
            <div className="count">
              <div className="digit">
                <h1>6</h1>
              </div>
              <div className="digit">
                <h1>5</h1>
              </div>
            </div>
            <div className="count">
              <div className="digit">
                <h1>9</h1>
              </div>
              <div className="digit">
                <h1>8</h1>
              </div>
            </div>
            <div className="count">
              <div className="digit">
                <h1>9</h1>
              </div>
              <div className="digit">
                <h1>9</h1>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <section className="hero">
        {/* <div className="hero-bg">
          <img className="hero-img" src="/home/hero.jpg" alt="" />
        </div> */}
        <div className="hero-gradient"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-header">
              <Copy animateOnScroll={false} delay={heroTitleDelay}>
                <h1>Impressive websites, systems, Android apps, and interactive launches.</h1>
              </Copy>
            </div>
            <div className="hero-tagline">
              <Copy animateOnScroll={false} delay={heroTaglineDelay}>
                <p>
                  We partner with ambitious teams to design and build digital
                  products that look sharp, move fast, and stay useful long
                  after launch.
                </p>
              </Copy>
            </div>
            <AnimatedButton
              label="View Projects"
              route="/projects"
              animateOnScroll={false}
              delay={heroButtonDelay}
            />
          </div>
        </div>
      </section>
      <section className="what-we-do">
        <div className="container">
          <div className="what-we-do-header">
            <Copy delay={0.1}>
              <h1>
                <span className="spacer">&nbsp;</span>
                Ancs Studio is a digital agency for brands and product teams
                that need websites, internal systems, mobile apps, and
                interactive experiences with real engineering behind the polish.
              </h1>
            </Copy>
          </div>
          <div className="what-we-do-content">
            <div className="what-we-do-col">
              <Copy delay={0.1}>
                <p>What we build</p>
              </Copy>

              <Copy delay={0.15}>
                <p className="lg">
                  From launch sites and conversion funnels to operations
                  dashboards, Android apps, and internal platforms, we shape
                  the interface, define the system, and ship the build.
                </p>
              </Copy>
            </div>
            <div className="what-we-do-col">
              <div className="what-we-do-tags" ref={tagsRef}>
                <div className="what-we-do-tag">
                  <h3>Websites</h3>
                </div>
                <div className="what-we-do-tag">
                  <h3>Systems</h3>
                </div>
                <div className="what-we-do-tag">
                  <h3>Interactive</h3>
                </div>
                <div className="what-we-do-tag">
                  <h3>Android</h3>
                </div>
                <div className="what-we-do-tag">
                  <h3>Dashboards</h3>
                </div>
                <div className="what-we-do-tag">
                  <h3>Automation</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="featured-projects-container">
        <div className="container">
          <div className="featured-projects-header-callout">
            <Copy delay={0.1}>
              <p>Selected work</p>
            </Copy>
          </div>
          <div className="featured-projects-header">
            <Copy delay={0.15}>
              <h2>Recent launches, systems, and product builds</h2>
            </Copy>
          </div>
        </div>
        <FeaturedProjects />
      </section>
      <section className="gallery-callout">
        <div className="container">
          <div className="gallery-callout-col">
            <div className="gallery-callout-row">
              <div className="gallery-callout-img gallery-callout-img-1">
                <img src="/gallery-callout/gallery-callout-1.jpg" alt="" />
              </div>
              <div className="gallery-callout-img gallery-callout-img-2">
                <img src="/gallery-callout/gallery-callout-2.jpg" alt="" />
                <div className="gallery-callout-img-content">
                  <h3>60+</h3>
                  <p>Screens Shipped</p>
                </div>
              </div>
            </div>
            <div className="gallery-callout-row">
              <div className="gallery-callout-img gallery-callout-img-3">
                <img src="/gallery-callout/gallery-callout-3.jpg" alt="" />
              </div>
              <div className="gallery-callout-img gallery-callout-img-4">
                <img src="/gallery-callout/gallery-callout-4.jpg" alt="" />
              </div>
            </div>
          </div>
          <div className="gallery-callout-col">
            <div className="gallery-callout-copy">
              <Copy delay={0.1}>
                <h3>
                  Explore launch websites, admin surfaces, Android flows, and
                  interactive product experiments from recent client work.
                </h3>
              </Copy>
              <AnimatedButton label="Browse Projects" route="/projects" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
