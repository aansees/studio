"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./style.module.css";
import {
  COUNTER_COLUMNS,
  COUNTER_EASE,
  COUNTER_START_DELAY,
  COUNTER_STEP_DURATION,
  LOADER_EDGE_OFFSET,
  REDUCED_MOTION_REVEAL_DURATION,
  REVEAL_COLORS,
  REVEAL_DURATION,
  REVEAL_EASE,
  REVEAL_PATH,
  REVEAL_STAGGER,
  REVEAL_VIEWPORT_MULTIPLIER,
} from "./anim";

gsap.registerPlugin(useGSAP);

type PreloaderProps = {
  onComplete?: () => void;
};

function getRevealTargetSize(
  svg: SVGSVGElement,
  viewportWidth: number,
  viewportHeight: number,
) {
  const viewBox = svg.viewBox.baseVal;
  const viewBoxWidth = viewBox.width || 151;
  const viewBoxHeight = viewBox.height || 148;
  const widthScale = (viewportWidth * REVEAL_VIEWPORT_MULTIPLIER) / viewBoxWidth;
  const heightScale =
    (viewportHeight * REVEAL_VIEWPORT_MULTIPLIER) / viewBoxHeight;
  const scale = Math.max(widthScale, heightScale);

  return {
    width: Math.ceil(viewBoxWidth * scale),
    height: Math.ceil(viewBoxHeight * scale),
  };
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const countGroup = root?.querySelector<HTMLElement>("[data-count-group]");
      const countWrappers = gsap.utils.toArray<HTMLElement>("[data-count-wrapper]");
      const tracks = gsap.utils.toArray<HTMLElement>("[data-count-track]");
      const revealers = gsap.utils.toArray<SVGSVGElement>("[data-revealer]");

      if (
        !root ||
        !countGroup ||
        countWrappers.length === 0 ||
        tracks.length === 0 ||
        revealers.length === 0
      ) {
        onCompleteRef.current?.();
        return;
      }

      const slotWidth = countWrappers[0].getBoundingClientRect().width;
      const trackWidth = tracks[0].scrollWidth;
      const travelDistance = Math.max(
        window.innerWidth - slotWidth - LOADER_EDGE_OFFSET,
        0,
      );
      const stepDistance = travelDistance / COUNTER_COLUMNS[0].length;
      const revealTargetSize = getRevealTargetSize(
        revealers[0],
        window.innerWidth,
        window.innerHeight,
      );
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.set(tracks, {
        x: -trackWidth,
        force3D: true,
      });
      gsap.set(revealers, {
        width: 0,
        height: 0,
      });

      if (prefersReducedMotion) {
        gsap
          .timeline({
            onComplete: () => onCompleteRef.current?.(),
          })
          .set(tracks, {
            x: slotWidth,
          })
          .to(countGroup, {
            autoAlpha: 0,
            duration: 0.2,
            ease: "power2.out",
          })
          .to(
            revealers,
            {
              width: revealTargetSize.width,
              height: revealTargetSize.height,
              duration: REDUCED_MOTION_REVEAL_DURATION,
              stagger: 0.08,
              ease: REVEAL_EASE,
            },
            "<",
          );

        return;
      }

      const timeline = gsap.timeline({
        defaults: {
          ease: COUNTER_EASE,
        },
        onComplete: () => onCompleteRef.current?.(),
      });

      timeline.to(tracks, {
        x: -trackWidth + slotWidth,
        duration: COUNTER_STEP_DURATION,
        delay: COUNTER_START_DELAY,
      });

      for (let step = 1; step <= COUNTER_COLUMNS[0].length; step += 1) {
        timeline.to(
          tracks,
          {
            x: -trackWidth + slotWidth * (step + 1),
            duration: COUNTER_STEP_DURATION,
          },
          ">",
        );
        timeline.to(
          countGroup,
          {
            x: stepDistance * step,
            duration: COUNTER_STEP_DURATION,
          },
          "<",
        );
      }

      timeline.to(
        countGroup,
        {
          autoAlpha: 0,
          y: 24,
          duration: 0.35,
          ease: "power2.out",
        },
        "-=0.12",
      );
      timeline.to(
        revealers,
        {
          width: revealTargetSize.width,
          height: revealTargetSize.height,
          duration: REVEAL_DURATION,
          stagger: REVEAL_STAGGER,
          ease: REVEAL_EASE,
        },
        "<",
      );
    },
    {
      scope: rootRef,
    },
  );

  return (
    <div
      ref={rootRef}
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-label="Loading landing page"
    >
      <div className={styles.countGroup} data-count-group aria-hidden="true">
        {COUNTER_COLUMNS.map((column, columnIndex) => (
          <div
            key={`${column.join("")}-${columnIndex}`}
            className={styles.countWrapper}
            data-count-wrapper
          >
            <div className={styles.countTrack} data-count-track>
              {column.map((digit, digitIndex) => (
                <div key={`${digit}-${digitIndex}`} className={styles.digit}>
                  <span className={styles.digitValue}>{digit}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.revealers} aria-hidden="true">
        {REVEAL_COLORS.map((color) => (
          <svg
            key={color}
            className={styles.revealer}
            data-revealer
            viewBox="0 0 151 148"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={REVEAL_PATH} fill={color} />
          </svg>
        ))}
      </div>
    </div>
  );
}
