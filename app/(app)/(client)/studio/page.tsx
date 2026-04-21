"use client";
/* eslint-disable @next/next/no-img-element */

import "./studio.css";
import HowWeWork from "../_components/how-we-work/how-we-work";
import Copy from "../_components/copy/copy";

export default function StudioPage() {
  return (
    <div className="page studio">
      <section className="studio-hero">
        <div className="container">
          <div className="studio-hero-col">
            <Copy delay={0.85}>
              <p>
                We are a compact agency that blends brand thinking, product
                design, and engineering into one shipping team.
              </p>
            </Copy>
          </div>
          <div className="studio-hero-col">
            <Copy delay={0.85}>
              <h2>
                ANCS Studio helps companies ship polished digital experiences
                without the drag of fragmented teams. We work across websites,
                internal systems, interactive launches, client portals, and
                Android products.
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
                <p>Projects shipped</p>
                <h2>48+</h2>
              </Copy>
            </div>
            <div className="fact">
              <Copy delay={0.2}>
                <p>Systems designed</p>
                <h2>16</h2>
              </Copy>
            </div>
            <div className="fact">
              <Copy delay={0.3}>
                <p>Android releases</p>
                <h2>12</h2>
              </Copy>
            </div>
            <div className="fact">
              <Copy delay={0.4}>
                <p>Client teams supported</p>
                <h2>30+</h2>
              </Copy>
            </div>
            <div className="fact">
              <Copy delay={0.5}>
                <p>Automations delivered</p>
                <h2>90</h2>
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
    </div>
  );
}
