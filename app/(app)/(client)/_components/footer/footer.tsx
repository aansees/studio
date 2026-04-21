"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  RiDribbbleLine,
  RiInstagramLine,
  RiLinkedinBoxLine,
  RiYoutubeLine,
} from "@remixicon/react";
import { useViewTransition } from "../use-view-transition";
import Copy from "../copy/copy";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const { navigateWithTransition } = useViewTransition();
  const socialIconsRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

  useGSAP(
    () => {
      if (!socialIconsRef.current) {
        return;
      }

      const icons = socialIconsRef.current.querySelectorAll(".icon");
      gsap.set(icons, { opacity: 0, x: -40 });

      ScrollTrigger.create({
        trigger: socialIconsRef.current,
        start: "top 90%",
        once: true,
        animation: gsap.to(icons, {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: -0.1,
          ease: "power3.out",
        }),
      });
    },
    { scope: socialIconsRef },
  );

  return (
    <div className="footer">
      <div className="footer-meta">
        <div className="container footer-meta-header">
          <div className="footer-meta-col">
            <div className="footer-meta-block">
              <div className="footer-meta-logo">
                <Copy delay={0.1}>
                  <h3 className="lg">Ancs Studio</h3>
                </Copy>
              </div>
              <Copy delay={0.2}>
                <h2>Spaces made simple, thoughtful, lasting.</h2>
              </Copy>
            </div>
          </div>
          <div className="footer-meta-col">
            <div className="footer-nav-links">
              <Copy delay={0.1}>
                <Link
                  href="/"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateWithTransition("/");
                  }}
                >
                  <h3>Index</h3>
                </Link>
                <Link
                  href="/studio"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateWithTransition("/studio");
                  }}
                >
                  <h3>Studio</h3>
                </Link>
                <Link
                  href="/spaces"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateWithTransition("/spaces");
                  }}
                >
                  <h3>Our Spaces</h3>
                </Link>
                <Link
                  href="/sample-space"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateWithTransition("/sample-space");
                  }}
                >
                  <h3>One Installation</h3>
                </Link>
                <Link
                  href="/connect"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateWithTransition("/connect");
                  }}
                >
                  <h3>Connect</h3>
                </Link>
              </Copy>
            </div>
          </div>
        </div>
        <div className="container footer-socials">
          <div className="footer-meta-col">
            <div className="footer-socials-wrapper" ref={socialIconsRef}>
              <div className="icon">
                <RiLinkedinBoxLine />
              </div>
              <div className="icon">
                <RiInstagramLine />
              </div>
              <div className="icon">
                <RiDribbbleLine />
              </div>
              <div className="icon">
                <RiYoutubeLine />
              </div>
            </div>
          </div>
          <div className="footer-meta-col">
            <Copy delay={0.1}>
              <p>
                We believe design is not decoration but the quiet structure that
                shapes experience.
              </p>
            </Copy>
          </div>
        </div>
      </div>
      <div className="footer-outro">
        <div className="container">
          <div className="footer-header">
            <img src="/logos/ancs-studio-footer-logo.svg" alt="Ancs Studio logo" />
          </div>
          <div className="footer-copyright">
            <p>
              Developed by - <span>Admin12121</span>
            </p>
            <p>This website is using cookies.</p>
            <p>All rights reserved &copy; {currentYear}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
