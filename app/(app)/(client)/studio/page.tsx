"use client";
/* eslint-disable @next/next/no-img-element */

import "./studio.css";
import HowWeWork from "../_components/how-we-work/how-we-work";
import Spotlight from "../_components/spotlight/spotlight";
import Copy from "../_components/copy/copy";

export default function StudioPage() {
  return (
    <div className="page studio">
      <section className="studio-hero">
        <div className="container">
          <div className="studio-hero-col">
            <Copy delay={0.85}>
              <p>
                We see design as more than construction. It is an ongoing
                dialogue between people, material, and place, shaped with care,
                and built to endure.
              </p>
            </Copy>
          </div>
          <div className="studio-hero-col">
            <Copy delay={0.85}>
              <h2>
                Our studio exists to create spaces that feel honest, lived in,
                and quietly transformative. Every project begins with listening
                and ends with an environment.
              </h2>
            </Copy>
            <div className="studio-hero-hero-img">
              <img src="/studio/about-hero.png" alt="" />
            </div>
          </div>
        </div>
      </section>
      <section className="more-facts">
        <div className="container">
          <div className="more-facts-items">
            <div className="fact">
              <Copy delay={0.1}>
                <p>Models crafted</p>
                <h2>120+</h2>
              </Copy>
            </div>
            <div className="fact">
              <Copy delay={0.2}>
                <p>Materials explored</p>
                <h2>60</h2>
              </Copy>
            </div>
            <div className="fact">
              <Copy delay={0.3}>
                <p>Workshops hosted</p>
                <h2>25+</h2>
              </Copy>
            </div>
            <div className="fact">
              <Copy delay={0.4}>
                <p>Hours logged</p>
                <h2>3k+</h2>
              </Copy>
            </div>
            <div className="fact">
              <Copy delay={0.5}>
                <p>Prototypes build</p>
                <h2>724</h2>
              </Copy>
            </div>
          </div>
        </div>
      </section>
      <section className="how-we-work-container">
        <div className="container">
          <HowWeWork />
        </div>
      </section>
      {/* <Spotlight /> */}
    </div>
  );
}
