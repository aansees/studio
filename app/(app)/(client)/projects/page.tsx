"use client";
/* eslint-disable @next/next/no-img-element */

import "./projects.css";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Copy from "../_components/copy/copy";
import { useViewTransition } from "../_components/use-view-transition";
import { projectsData } from "./projects";

gsap.registerPlugin(ScrollTrigger);

export default function SpacesPage() {
  const spacesRef = useRef<HTMLDivElement | null>(null);
  const scrollTriggerInstances = useRef<ScrollTrigger[]>([]);
  const { navigateWithTransition } = useViewTransition();

  const cleanupScrollTriggers = () => {
    scrollTriggerInstances.current.forEach((instance) => {
      instance.kill();
    });
    scrollTriggerInstances.current = [];
  };

  const setupAnimations = () => {
    cleanupScrollTriggers();

    if (!spacesRef.current) {
      return;
    }

    const spaces = spacesRef.current.querySelectorAll<HTMLElement>(".space");
    if (spaces.length === 0) {
      return;
    }

    spaces.forEach((space, index) => {
      gsap.set(space, {
        opacity: 0,
        scale: 0.75,
        y: 150,
      });

      if (index === 0) {
        gsap.to(space, {
          duration: 0.75,
          y: 0,
          scale: 1,
          opacity: 1,
          ease: "power3.out",
          delay: 1.4,
        });
        return;
      }

      const trigger = ScrollTrigger.create({
        trigger: space,
        start: "top 100%",
        onEnter: () => {
          gsap.to(space, {
            duration: 0.75,
            y: 0,
            scale: 1,
            opacity: 1,
            ease: "power3.out",
          });
        },
      });

      scrollTriggerInstances.current.push(trigger);
    });

    ScrollTrigger.refresh();
  };

  useEffect(() => {
    setupAnimations();

    const handleResize = () => {
      setupAnimations();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cleanupScrollTriggers();
    };
  }, []);

  return (
    <div className="page spaces">
      <section className="spaces-header">
        <div className="container">
          <div className="prop-col">
            <Copy delay={0.9}>
              <p>Selected work</p>
            </Copy>
          </div>
          <div className="prop-col">
            <Copy delay={1}>
              <h1>Selected Projects</h1>
            </Copy>
            <div className="prop-filters">
              <div className="filter default">
                <Copy delay={1}>
                  <p className="lg">All</p>
                </Copy>
              </div>
              <div className="filter">
                <Copy delay={1.1}>
                  <p className="lg">Websites</p>
                </Copy>
              </div>
              <div className="filter">
                <Copy delay={1.2}>
                  <p className="lg">Systems</p>
                </Copy>
              </div>
              <div className="filter">
                <Copy delay={1.3}>
                  <p className="lg">Android</p>
                </Copy>
              </div>
              <div className="filter">
                <Copy delay={1.4}>
                  <p className="lg">Interactive</p>
                </Copy>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="spaces-list">
        <div className="container" ref={spacesRef}>
          {projectsData.map((project) => (
            <a
              key={project.id}
              href={project.route}
              className="space"
              onClick={(event) => {
                event.preventDefault();
                navigateWithTransition(project.route);
              }}
            >
              <div className="space-img">
                <img src={project.image} alt={project.name} />
              </div>
              <div className="space-info">
                <div className="prop-info-col">
                  <div className="prop-date">
                    <p>{project.date}</p>
                  </div>
                </div>
                <div className="prop-info-col">
                  <div className="prop-info-sub-col">
                    <div className="prop-name">
                      <h3>{project.name}</h3>
                      <p className="lg">{project.subtitle}</p>
                    </div>
                  </div>
                  <div className="prop-info-sub-col">
                    <div className="prop-client">
                      <div className="prop-client-img">
                        <img src={project.clientImage} alt={project.clientName} />
                      </div>
                      <div className="prop-client-name">
                        <p>{project.clientName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
