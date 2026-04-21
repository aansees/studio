"use client";
/* eslint-disable @next/next/no-img-element */

import "./contact.css";
import Copy from "../_components/copy/copy";

export default function ConnectPage() {
  const currentYearShort = String(new Date().getFullYear()).slice(-2);

  return (
    <div className="page contact">
      <section className="contact-hero">
        <div className="container">
          <div className="contact-col">
            <div className="contact-hero-header">
              <Copy delay={0.85}>
                <h1>Big digital projects begin with a sharp brief</h1>
              </Copy>
            </div>
            <div className="contact-copy-year">
              <Copy delay={0.1}>
                <h1>&copy;{currentYearShort}</h1>
              </Copy>
            </div>
          </div>
          <div className="contact-col">
            <div className="contact-info">
              <div className="contact-info-block">
                <Copy delay={0.85}>
                  <p>General</p>
                  <p>desk@ancs.studio</p>
                </Copy>
              </div>
              <div className="contact-info-block">
                <Copy delay={1}>
                  <p>New Projects</p>
                  <p>build@ancs.studio</p>
                  <p>+1 (872) 441-2086</p>
                </Copy>
              </div>
              <div className="contact-info-block">
                <Copy delay={1.15}>
                  <p>What We Build</p>
                  <p>Websites and systems</p>
                  <p>Android apps and interactive launches</p>
                </Copy>
              </div>
              <div className="contact-info-block">
                <Copy delay={1.3}>
                  <p>Base</p>
                  <p>Seattle, WA</p>
                  <p>Remote worldwide</p>
                </Copy>
              </div>
            </div>
            <div className="contact-img">
              <img src="/contact/contact-img.jpg" alt="Ancs Studio project planning" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
