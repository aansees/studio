"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import featuredProjectsContent from "./featured-projects-content";

export default function FeaturedProjects() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const featuredProjectCards = gsap.utils.toArray<HTMLElement>(
      ".featured-project-card",
    );
    const triggers: ScrollTrigger[] = [];

    featuredProjectCards.forEach((featuredProjectCard, index) => {
      if (index >= featuredProjectCards.length - 1) {
        return;
      }

      const featuredProjectCardInner =
        featuredProjectCard.querySelector<HTMLElement>(".featured-project-card-inner");

      if (!featuredProjectCardInner) {
        return;
      }

      const isMobile = window.innerWidth <= 1000;

      const tween = gsap.fromTo(
        featuredProjectCardInner,
        {
          y: "0%",
          z: 0,
          rotationX: 0,
        },
        {
          y: "-50%",
          z: -250,
          rotationX: 45,
          scrollTrigger: {
            trigger: featuredProjectCards[index + 1],
            start: isMobile ? "top 85%" : "top 100%",
            end: "top -75%",
            scrub: true,
            pin: featuredProjectCard,
            pinSpacing: false,
          },
        },
      );

      if (tween.scrollTrigger) {
        triggers.push(tween.scrollTrigger);
      }

      const opacityTween = gsap.to(featuredProjectCardInner, {
        "--after-opacity": 1,
        scrollTrigger: {
          trigger: featuredProjectCards[index + 1],
          start: "top 75%",
          end: "top 0%",
          scrub: true,
        },
      });

      if (opacityTween.scrollTrigger) {
        triggers.push(opacityTween.scrollTrigger);
      }
    });

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="featured-projects">
      {featuredProjectsContent.map((project, index) => (
        <div key={`${project.title}-${index}`} className="featured-project-card">
          <div className="featured-project-card-inner">
            <div className="featured-project-card-content">
              <div className="featured-project-card-info">
                <p>{project.info}</p>
              </div>
              <div className="featured-project-card-content-main">
                <div className="featured-project-card-title">
                  <h2>{project.title}</h2>
                </div>
                <div className="featured-project-card-description">
                  <p className="lg">{project.description}</p>
                </div>
              </div>
            </div>
            <div className="featured-project-card-img">
              <img src={project.image} alt={project.title} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
