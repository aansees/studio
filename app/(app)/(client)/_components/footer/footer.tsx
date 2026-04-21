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
                <h2>Websites, systems, apps, and interfaces built to perform.</h2>
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
                  <h3>Home</h3>
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
                  href="/projects"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateWithTransition("/projects");
                  }}
                >
                  <h3>Projects</h3>
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
                We help teams turn ambitious briefs into clean launches,
                practical systems, and digital experiences that stay usable
                after handoff.
              </p>
            </Copy>
          </div>
        </div>
      </div>
      <div className="footer-outro">
        <div className="container pb-0!">
          <div className="footer-header">
            <h1
              className="font-otis-display uppercase text-center italic leading-[0.95]"
              style={{ fontSize: "15vw" }}
            >
              Ancs Studio
            </h1>
          </div>
          <div className="footer-copyright">
            <p>
              Developed by -{" "}
              <a href="https://admin12121.com" target="_blank" className="font-otis-display">
                Admin12121
              </a>
            </p>
            <p>Built for ambitious product and brand teams.</p>
            <p>All rights reserved &copy; {currentYear}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
