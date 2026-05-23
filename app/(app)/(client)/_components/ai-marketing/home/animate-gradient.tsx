'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useRef } from 'react';

gsap.registerPlugin(MotionPathPlugin, useGSAP);

const PATH_IDS = [
  'curve-path-1',
  'curve-path-2',
  'curve-path-3',
  'curve-path-4',
  'curve-path-5',
  'curve-path-6',
  'curve-path-7',
  'curve-path-8',
] as const;

const RECTS_PER_PATH = 60;
const COLOR_START = '#FFFFFF';
const COLOR_END = '#1E212A';

function interpolateColor(color1: string, color2: string, factor: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const AnimateGradient = () => {
  const containerRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const svg = containerRef.current;
      if (!svg) return;

      PATH_IDS.forEach((pathId, pathIndex) => {
        const path = svg.querySelector<SVGPathElement>(`#${pathId}`);
        if (!path) return;

        const duration = gsap.utils.random(3, 6);
        const delay = gsap.utils.random(0, 2);
        const rectPrefix = `rect-${pathIndex + 1}-`;

        for (let i = 1; i <= RECTS_PER_PATH; i++) {
          const rect = svg.querySelector<SVGRectElement>(`#${rectPrefix}${i}`);
          if (!rect) continue;

          const factor = (i - 1) / (RECTS_PER_PATH - 1);
          rect.setAttribute('fill', interpolateColor(COLOR_START, COLOR_END, factor));

          gsap.to(rect, {
            motionPath: {
              path,
              align: path,
              alignOrigin: [0.5, 0.5],
              autoRotate: false,
            },
            duration,
            ease: 'power1.inOut',
            repeat: -1,
            delay: delay + i * 0.002,
          });
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <svg
      ref={containerRef}
      xmlns="http://www.w3.org/2000/svg"
      className="relative top-0 mx-auto h-auto w-full max-w-full sm:max-w-[400px] md:max-w-[600px] lg:max-w-[800px] xl:max-w-[1000px] 2xl:max-w-[1482px]"
      viewBox="0 0 1482 1378"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        id="curve-path-1"
        d="M420.5 0V688.857C420.5 739.32 398.08 787.176 359.307 819.475L221.193 934.525C182.42 966.824 160 1014.68 160 1065.14V1436"
        className="stroke-[#fafcff0d]"
      />
      <path
        id="curve-path-2"
        d="M1040.5 0V688.857C1040.5 739.32 1057.92 787.176 1096.69 819.475L1234.81 934.525C1273.58 966.824 1296 1014.68 1296 1065.14V1436"
        className="stroke-[#fafcff0d]"
      />
      <path
        id="curve-path-3"
        d="M296.5 0V647.386C296.5 696.681 275.102 743.549 237.854 775.839L54.6455 934.661C17.3976 966.951 -4 1013.82 -4 1063.11V1469.5"
        className="stroke-[#fafcff0d]"
      />
      <path
        id="curve-path-4"
        d="M1164.5 0V647.386C1164.5 696.681 1185.9 743.549 1223.15 775.839L1406.35 934.661C1443.6 966.951 1465 1013.82 1465 1063.11V1469.5"
        className="stroke-[#fafcff0d]"
      />
      <path
        id="curve-path-5"
        d="M544.5 0V704.584C544.5 749.67 526.589 792.911 494.708 824.792L383.792 935.708C351.911 967.589 334 1010.83 334 1055.92V1469.5"
        className="stroke-[#fafcff0d]"
      />
      <path
        id="curve-path-6"
        d="M916.5 0V704.584C916.5 749.67 934.411 792.911 966.292 824.792L1077.21 935.708C1109.09 967.589 1127 1010.83 1127 1055.92V1469.5"
        className="stroke-[#fafcff0d]"
      />
      <path
        id="curve-path-7"
        d="M668.5 0V679.422C668.5 709.28 660.636 738.611 645.7 764.465L540.8 946.035C525.864 971.889 518 1001.22 518 1031.08V1469.5"
        className="stroke-[#fafcff0d]"
      />
      <path
        id="curve-path-8"
        d="M792.5 0V679.422C792.5 709.28 800.364 738.611 815.3 764.465L920.2 946.035C935.136 971.889 943 1001.22 943 1031.08V1469.5"
        className="stroke-[#fafcff0d]"
      />
      {/* Animated rectangles */}
      <rect id="rect-1-1" width={1} height={1} />
      <rect id="rect-1-2" width={1} height={1} />
      <rect id="rect-1-3" width={1} height={1} />
      <rect id="rect-1-4" width={1} height={1} />
      <rect id="rect-1-5" width={1} height={1} />
      <rect id="rect-1-6" width={1} height={1} />
      <rect id="rect-1-7" width={1} height={1} />
      <rect id="rect-1-8" width={1} height={1} />
      <rect id="rect-1-9" width={1} height={1} />
      <rect id="rect-1-10" width={1} height={1} />
      <rect id="rect-1-11" width={1} height={1} />
      <rect id="rect-1-12" width={1} height={1} />
      <rect id="rect-1-13" width={1} height={1} />
      <rect id="rect-1-14" width={1} height={1} />
      <rect id="rect-1-15" width={1} height={1} />
      <rect id="rect-1-16" width={1} height={1} />
      <rect id="rect-1-17" width={1} height={1} />
      <rect id="rect-1-18" width={1} height={1} />
      <rect id="rect-1-19" width={1} height={1} />
      <rect id="rect-1-20" width={1} height={1} />
      <rect id="rect-1-21" width={1} height={1} />
      <rect id="rect-1-22" width={1} height={1} />
      <rect id="rect-1-23" width={1} height={1} />
      <rect id="rect-1-24" width={1} height={1} />
      <rect id="rect-1-25" width={1} height={1} />
      <rect id="rect-1-26" width={1} height={1} />
      <rect id="rect-1-27" width={1} height={1} />
      <rect id="rect-1-28" width={1} height={1} />
      <rect id="rect-1-29" width={1} height={1} />
      <rect id="rect-1-30" width={1} height={1} />
      <rect id="rect-1-31" width={1} height={1} />
      <rect id="rect-1-32" width={1} height={1} />
      <rect id="rect-1-33" width={1} height={1} />
      <rect id="rect-1-34" width={1} height={1} />
      <rect id="rect-1-35" width={1} height={1} />
      <rect id="rect-1-36" width={1} height={1} />
      <rect id="rect-1-37" width={1} height={1} />
      <rect id="rect-1-38" width={1} height={1} />
      <rect id="rect-1-39" width={1} height={1} />
      <rect id="rect-1-40" width={1} height={1} />
      <rect id="rect-1-41" width={1} height={1} />
      <rect id="rect-1-42" width={1} height={1} />
      <rect id="rect-1-43" width={1} height={1} />
      <rect id="rect-1-44" width={1} height={1} />
      <rect id="rect-1-45" width={1} height={1} />
      <rect id="rect-1-46" width={1} height={1} />
      <rect id="rect-1-47" width={1} height={1} />
      <rect id="rect-1-48" width={1} height={1} />
      <rect id="rect-1-49" width={1} height={1} />
      <rect id="rect-1-50" width={1} height={1} />
      <rect id="rect-1-51" width={1} height={1} />
      <rect id="rect-1-52" width={1} height={1} />
      <rect id="rect-1-53" width={1} height={1} />
      <rect id="rect-1-54" width={1} height={1} />
      <rect id="rect-1-55" width={1} height={1} />
      <rect id="rect-1-56" width={1} height={1} />
      <rect id="rect-1-57" width={1} height={1} />
      <rect id="rect-1-58" width={1} height={1} />
      <rect id="rect-1-59" width={1} height={1} />
      <rect id="rect-1-60" width={1} height={1} />
      <rect id="rect-2-1" width={1} height={1} />
      <rect id="rect-2-2" width={1} height={1} />
      <rect id="rect-2-3" width={1} height={1} />
      <rect id="rect-2-4" width={1} height={1} />
      <rect id="rect-2-5" width={1} height={1} />
      <rect id="rect-2-6" width={1} height={1} />
      <rect id="rect-2-7" width={1} height={1} />
      <rect id="rect-2-8" width={1} height={1} />
      <rect id="rect-2-9" width={1} height={1} />
      <rect id="rect-2-10" width={1} height={1} />
      <rect id="rect-2-11" width={1} height={1} />
      <rect id="rect-2-12" width={1} height={1} />
      <rect id="rect-2-13" width={1} height={1} />
      <rect id="rect-2-14" width={1} height={1} />
      <rect id="rect-2-15" width={1} height={1} />
      <rect id="rect-2-16" width={1} height={1} />
      <rect id="rect-2-17" width={1} height={1} />
      <rect id="rect-2-18" width={1} height={1} />
      <rect id="rect-2-19" width={1} height={1} />
      <rect id="rect-2-20" width={1} height={1} />
      <rect id="rect-2-21" width={1} height={1} />
      <rect id="rect-2-22" width={1} height={1} />
      <rect id="rect-2-23" width={1} height={1} />
      <rect id="rect-2-24" width={1} height={1} />
      <rect id="rect-2-25" width={1} height={1} />
      <rect id="rect-2-26" width={1} height={1} />
      <rect id="rect-2-27" width={1} height={1} />
      <rect id="rect-2-28" width={1} height={1} />
      <rect id="rect-2-29" width={1} height={1} />
      <rect id="rect-2-30" width={1} height={1} />
      <rect id="rect-2-31" width={1} height={1} />
      <rect id="rect-2-32" width={1} height={1} />
      <rect id="rect-2-33" width={1} height={1} />
      <rect id="rect-2-34" width={1} height={1} />
      <rect id="rect-2-35" width={1} height={1} />
      <rect id="rect-2-36" width={1} height={1} />
      <rect id="rect-2-37" width={1} height={1} />
      <rect id="rect-2-38" width={1} height={1} />
      <rect id="rect-2-39" width={1} height={1} />
      <rect id="rect-2-40" width={1} height={1} />
      <rect id="rect-2-41" width={1} height={1} />
      <rect id="rect-2-42" width={1} height={1} />
      <rect id="rect-2-43" width={1} height={1} />
      <rect id="rect-2-44" width={1} height={1} />
      <rect id="rect-2-45" width={1} height={1} />
      <rect id="rect-2-46" width={1} height={1} />
      <rect id="rect-2-47" width={1} height={1} />
      <rect id="rect-2-48" width={1} height={1} />
      <rect id="rect-2-49" width={1} height={1} />
      <rect id="rect-2-50" width={1} height={1} />
      <rect id="rect-2-51" width={1} height={1} />
      <rect id="rect-2-52" width={1} height={1} />
      <rect id="rect-2-53" width={1} height={1} />
      <rect id="rect-2-54" width={1} height={1} />
      <rect id="rect-2-55" width={1} height={1} />
      <rect id="rect-2-56" width={1} height={1} />
      <rect id="rect-2-57" width={1} height={1} />
      <rect id="rect-2-58" width={1} height={1} />
      <rect id="rect-2-59" width={1} height={1} />
      <rect id="rect-2-60" width={1} height={1} />
      <rect id="rect-3-1" width={1} height={1} />
      <rect id="rect-3-2" width={1} height={1} />
      <rect id="rect-3-3" width={1} height={1} />
      <rect id="rect-3-4" width={1} height={1} />
      <rect id="rect-3-5" width={1} height={1} />
      <rect id="rect-3-6" width={1} height={1} />
      <rect id="rect-3-7" width={1} height={1} />
      <rect id="rect-3-8" width={1} height={1} />
      <rect id="rect-3-9" width={1} height={1} />
      <rect id="rect-3-10" width={1} height={1} />
      <rect id="rect-3-11" width={1} height={1} />
      <rect id="rect-3-12" width={1} height={1} />
      <rect id="rect-3-13" width={1} height={1} />
      <rect id="rect-3-14" width={1} height={1} />
      <rect id="rect-3-15" width={1} height={1} />
      <rect id="rect-3-16" width={1} height={1} />
      <rect id="rect-3-17" width={1} height={1} />
      <rect id="rect-3-18" width={1} height={1} />
      <rect id="rect-3-19" width={1} height={1} />
      <rect id="rect-3-20" width={1} height={1} />
      <rect id="rect-3-21" width={1} height={1} />
      <rect id="rect-3-22" width={1} height={1} />
      <rect id="rect-3-23" width={1} height={1} />
      <rect id="rect-3-24" width={1} height={1} />
      <rect id="rect-3-25" width={1} height={1} />
      <rect id="rect-3-26" width={1} height={1} />
      <rect id="rect-3-27" width={1} height={1} />
      <rect id="rect-3-28" width={1} height={1} />
      <rect id="rect-3-29" width={1} height={1} />
      <rect id="rect-3-30" width={1} height={1} />
      <rect id="rect-3-31" width={1} height={1} />
      <rect id="rect-3-32" width={1} height={1} />
      <rect id="rect-3-33" width={1} height={1} />
      <rect id="rect-3-34" width={1} height={1} />
      <rect id="rect-3-35" width={1} height={1} />
      <rect id="rect-3-36" width={1} height={1} />
      <rect id="rect-3-37" width={1} height={1} />
      <rect id="rect-3-38" width={1} height={1} />
      <rect id="rect-3-39" width={1} height={1} />
      <rect id="rect-3-40" width={1} height={1} />
      <rect id="rect-3-41" width={1} height={1} />
      <rect id="rect-3-42" width={1} height={1} />
      <rect id="rect-3-43" width={1} height={1} />
      <rect id="rect-3-44" width={1} height={1} />
      <rect id="rect-3-45" width={1} height={1} />
      <rect id="rect-3-46" width={1} height={1} />
      <rect id="rect-3-47" width={1} height={1} />
      <rect id="rect-3-48" width={1} height={1} />
      <rect id="rect-3-49" width={1} height={1} />
      <rect id="rect-3-50" width={1} height={1} />
      <rect id="rect-3-51" width={1} height={1} />
      <rect id="rect-3-52" width={1} height={1} />
      <rect id="rect-3-53" width={1} height={1} />
      <rect id="rect-3-54" width={1} height={1} />
      <rect id="rect-3-55" width={1} height={1} />
      <rect id="rect-3-56" width={1} height={1} />
      <rect id="rect-3-57" width={1} height={1} />
      <rect id="rect-3-58" width={1} height={1} />
      <rect id="rect-3-59" width={1} height={1} />
      <rect id="rect-3-60" width={1} height={1} />
      <rect id="rect-4-1" width={1} height={1} />
      <rect id="rect-4-2" width={1} height={1} />
      <rect id="rect-4-3" width={1} height={1} />
      <rect id="rect-4-4" width={1} height={1} />
      <rect id="rect-4-5" width={1} height={1} />
      <rect id="rect-4-6" width={1} height={1} />
      <rect id="rect-4-7" width={1} height={1} />
      <rect id="rect-4-8" width={1} height={1} />
      <rect id="rect-4-9" width={1} height={1} />
      <rect id="rect-4-10" width={1} height={1} />
      <rect id="rect-4-11" width={1} height={1} />
      <rect id="rect-4-12" width={1} height={1} />
      <rect id="rect-4-13" width={1} height={1} />
      <rect id="rect-4-14" width={1} height={1} />
      <rect id="rect-4-15" width={1} height={1} />
      <rect id="rect-4-16" width={1} height={1} />
      <rect id="rect-4-17" width={1} height={1} />
      <rect id="rect-4-18" width={1} height={1} />
      <rect id="rect-4-19" width={1} height={1} />
      <rect id="rect-4-20" width={1} height={1} />
      <rect id="rect-4-21" width={1} height={1} />
      <rect id="rect-4-22" width={1} height={1} />
      <rect id="rect-4-23" width={1} height={1} />
      <rect id="rect-4-24" width={1} height={1} />
      <rect id="rect-4-25" width={1} height={1} />
      <rect id="rect-4-26" width={1} height={1} />
      <rect id="rect-4-27" width={1} height={1} />
      <rect id="rect-4-28" width={1} height={1} />
      <rect id="rect-4-29" width={1} height={1} />
      <rect id="rect-4-30" width={1} height={1} />
      <rect id="rect-4-31" width={1} height={1} />
      <rect id="rect-4-32" width={1} height={1} />
      <rect id="rect-4-33" width={1} height={1} />
      <rect id="rect-4-34" width={1} height={1} />
      <rect id="rect-4-35" width={1} height={1} />
      <rect id="rect-4-36" width={1} height={1} />
      <rect id="rect-4-37" width={1} height={1} />
      <rect id="rect-4-38" width={1} height={1} />
      <rect id="rect-4-39" width={1} height={1} />
      <rect id="rect-4-40" width={1} height={1} />
      <rect id="rect-4-41" width={1} height={1} />
      <rect id="rect-4-42" width={1} height={1} />
      <rect id="rect-4-43" width={1} height={1} />
      <rect id="rect-4-44" width={1} height={1} />
      <rect id="rect-4-45" width={1} height={1} />
      <rect id="rect-4-46" width={1} height={1} />
      <rect id="rect-4-47" width={1} height={1} />
      <rect id="rect-4-48" width={1} height={1} />
      <rect id="rect-4-49" width={1} height={1} />
      <rect id="rect-4-50" width={1} height={1} />
      <rect id="rect-4-51" width={1} height={1} />
      <rect id="rect-4-52" width={1} height={1} />
      <rect id="rect-4-53" width={1} height={1} />
      <rect id="rect-4-54" width={1} height={1} />
      <rect id="rect-4-55" width={1} height={1} />
      <rect id="rect-4-56" width={1} height={1} />
      <rect id="rect-4-57" width={1} height={1} />
      <rect id="rect-4-58" width={1} height={1} />
      <rect id="rect-4-59" width={1} height={1} />
      <rect id="rect-4-60" width={1} height={1} />
      <rect id="rect-5-1" width={1} height={1} />
      <rect id="rect-5-2" width={1} height={1} />
      <rect id="rect-5-3" width={1} height={1} />
      <rect id="rect-5-4" width={1} height={1} />
      <rect id="rect-5-5" width={1} height={1} />
      <rect id="rect-5-6" width={1} height={1} />
      <rect id="rect-5-7" width={1} height={1} />
      <rect id="rect-5-8" width={1} height={1} />
      <rect id="rect-5-9" width={1} height={1} />
      <rect id="rect-5-10" width={1} height={1} />
      <rect id="rect-5-11" width={1} height={1} />
      <rect id="rect-5-12" width={1} height={1} />
      <rect id="rect-5-13" width={1} height={1} />
      <rect id="rect-5-14" width={1} height={1} />
      <rect id="rect-5-15" width={1} height={1} />
      <rect id="rect-5-16" width={1} height={1} />
      <rect id="rect-5-17" width={1} height={1} />
      <rect id="rect-5-18" width={1} height={1} />
      <rect id="rect-5-19" width={1} height={1} />
      <rect id="rect-5-20" width={1} height={1} />
      <rect id="rect-5-21" width={1} height={1} />
      <rect id="rect-5-22" width={1} height={1} />
      <rect id="rect-5-23" width={1} height={1} />
      <rect id="rect-5-24" width={1} height={1} />
      <rect id="rect-5-25" width={1} height={1} />
      <rect id="rect-5-26" width={1} height={1} />
      <rect id="rect-5-27" width={1} height={1} />
      <rect id="rect-5-28" width={1} height={1} />
      <rect id="rect-5-29" width={1} height={1} />
      <rect id="rect-5-30" width={1} height={1} />
      <rect id="rect-5-31" width={1} height={1} />
      <rect id="rect-5-32" width={1} height={1} />
      <rect id="rect-5-33" width={1} height={1} />
      <rect id="rect-5-34" width={1} height={1} />
      <rect id="rect-5-35" width={1} height={1} />
      <rect id="rect-5-36" width={1} height={1} />
      <rect id="rect-5-37" width={1} height={1} />
      <rect id="rect-5-38" width={1} height={1} />
      <rect id="rect-5-39" width={1} height={1} />
      <rect id="rect-5-40" width={1} height={1} />
      <rect id="rect-5-41" width={1} height={1} />
      <rect id="rect-5-42" width={1} height={1} />
      <rect id="rect-5-43" width={1} height={1} />
      <rect id="rect-5-44" width={1} height={1} />
      <rect id="rect-5-45" width={1} height={1} />
      <rect id="rect-5-46" width={1} height={1} />
      <rect id="rect-5-47" width={1} height={1} />
      <rect id="rect-5-48" width={1} height={1} />
      <rect id="rect-5-49" width={1} height={1} />
      <rect id="rect-5-50" width={1} height={1} />
      <rect id="rect-5-51" width={1} height={1} />
      <rect id="rect-5-52" width={1} height={1} />
      <rect id="rect-5-53" width={1} height={1} />
      <rect id="rect-5-54" width={1} height={1} />
      <rect id="rect-5-55" width={1} height={1} />
      <rect id="rect-5-56" width={1} height={1} />
      <rect id="rect-5-57" width={1} height={1} />
      <rect id="rect-5-58" width={1} height={1} />
      <rect id="rect-5-59" width={1} height={1} />
      <rect id="rect-5-60" width={1} height={1} />
      <rect id="rect-6-1" width={1} height={1} />
      <rect id="rect-6-2" width={1} height={1} />
      <rect id="rect-6-3" width={1} height={1} />
      <rect id="rect-6-4" width={1} height={1} />
      <rect id="rect-6-5" width={1} height={1} />
      <rect id="rect-6-6" width={1} height={1} />
      <rect id="rect-6-7" width={1} height={1} />
      <rect id="rect-6-8" width={1} height={1} />
      <rect id="rect-6-9" width={1} height={1} />
      <rect id="rect-6-10" width={1} height={1} />
      <rect id="rect-6-11" width={1} height={1} />
      <rect id="rect-6-12" width={1} height={1} />
      <rect id="rect-6-13" width={1} height={1} />
      <rect id="rect-6-14" width={1} height={1} />
      <rect id="rect-6-15" width={1} height={1} />
      <rect id="rect-6-16" width={1} height={1} />
      <rect id="rect-6-17" width={1} height={1} />
      <rect id="rect-6-18" width={1} height={1} />
      <rect id="rect-6-19" width={1} height={1} />
      <rect id="rect-6-20" width={1} height={1} />
      <rect id="rect-6-21" width={1} height={1} />
      <rect id="rect-6-22" width={1} height={1} />
      <rect id="rect-6-23" width={1} height={1} />
      <rect id="rect-6-24" width={1} height={1} />
      <rect id="rect-6-25" width={1} height={1} />
      <rect id="rect-6-26" width={1} height={1} />
      <rect id="rect-6-27" width={1} height={1} />
      <rect id="rect-6-28" width={1} height={1} />
      <rect id="rect-6-29" width={1} height={1} />
      <rect id="rect-6-30" width={1} height={1} />
      <rect id="rect-6-31" width={1} height={1} />
      <rect id="rect-6-32" width={1} height={1} />
      <rect id="rect-6-33" width={1} height={1} />
      <rect id="rect-6-34" width={1} height={1} />
      <rect id="rect-6-35" width={1} height={1} />
      <rect id="rect-6-36" width={1} height={1} />
      <rect id="rect-6-37" width={1} height={1} />
      <rect id="rect-6-38" width={1} height={1} />
      <rect id="rect-6-39" width={1} height={1} />
      <rect id="rect-6-40" width={1} height={1} />
      <rect id="rect-6-41" width={1} height={1} />
      <rect id="rect-6-42" width={1} height={1} />
      <rect id="rect-6-43" width={1} height={1} />
      <rect id="rect-6-44" width={1} height={1} />
      <rect id="rect-6-45" width={1} height={1} />
      <rect id="rect-6-46" width={1} height={1} />
      <rect id="rect-6-47" width={1} height={1} />
      <rect id="rect-6-48" width={1} height={1} />
      <rect id="rect-6-49" width={1} height={1} />
      <rect id="rect-6-50" width={1} height={1} />
      <rect id="rect-6-51" width={1} height={1} />
      <rect id="rect-6-52" width={1} height={1} />
      <rect id="rect-6-53" width={1} height={1} />
      <rect id="rect-6-54" width={1} height={1} />
      <rect id="rect-6-55" width={1} height={1} />
      <rect id="rect-6-56" width={1} height={1} />
      <rect id="rect-6-57" width={1} height={1} />
      <rect id="rect-6-58" width={1} height={1} />
      <rect id="rect-6-59" width={1} height={1} />
      <rect id="rect-6-60" width={1} height={1} />
      <rect id="rect-7-1" width={1} height={1} />
      <rect id="rect-7-2" width={1} height={1} />
      <rect id="rect-7-3" width={1} height={1} />
      <rect id="rect-7-4" width={1} height={1} />
      <rect id="rect-7-5" width={1} height={1} />
      <rect id="rect-7-6" width={1} height={1} />
      <rect id="rect-7-7" width={1} height={1} />
      <rect id="rect-7-8" width={1} height={1} />
      <rect id="rect-7-9" width={1} height={1} />
      <rect id="rect-7-10" width={1} height={1} />
      <rect id="rect-7-11" width={1} height={1} />
      <rect id="rect-7-12" width={1} height={1} />
      <rect id="rect-7-13" width={1} height={1} />
      <rect id="rect-7-14" width={1} height={1} />
      <rect id="rect-7-15" width={1} height={1} />
      <rect id="rect-7-16" width={1} height={1} />
      <rect id="rect-7-17" width={1} height={1} />
      <rect id="rect-7-18" width={1} height={1} />
      <rect id="rect-7-19" width={1} height={1} />
      <rect id="rect-7-20" width={1} height={1} />
      <rect id="rect-7-21" width={1} height={1} />
      <rect id="rect-7-22" width={1} height={1} />
      <rect id="rect-7-23" width={1} height={1} />
      <rect id="rect-7-24" width={1} height={1} />
      <rect id="rect-7-25" width={1} height={1} />
      <rect id="rect-7-26" width={1} height={1} />
      <rect id="rect-7-27" width={1} height={1} />
      <rect id="rect-7-28" width={1} height={1} />
      <rect id="rect-7-29" width={1} height={1} />
      <rect id="rect-7-30" width={1} height={1} />
      <rect id="rect-7-31" width={1} height={1} />
      <rect id="rect-7-32" width={1} height={1} />
      <rect id="rect-7-33" width={1} height={1} />
      <rect id="rect-7-34" width={1} height={1} />
      <rect id="rect-7-35" width={1} height={1} />
      <rect id="rect-7-36" width={1} height={1} />
      <rect id="rect-7-37" width={1} height={1} />
      <rect id="rect-7-38" width={1} height={1} />
      <rect id="rect-7-39" width={1} height={1} />
      <rect id="rect-7-40" width={1} height={1} />
      <rect id="rect-7-41" width={1} height={1} />
      <rect id="rect-7-42" width={1} height={1} />
      <rect id="rect-7-43" width={1} height={1} />
      <rect id="rect-7-44" width={1} height={1} />
      <rect id="rect-7-45" width={1} height={1} />
      <rect id="rect-7-46" width={1} height={1} />
      <rect id="rect-7-47" width={1} height={1} />
      <rect id="rect-7-48" width={1} height={1} />
      <rect id="rect-7-49" width={1} height={1} />
      <rect id="rect-7-50" width={1} height={1} />
      <rect id="rect-7-51" width={1} height={1} />
      <rect id="rect-7-52" width={1} height={1} />
      <rect id="rect-7-53" width={1} height={1} />
      <rect id="rect-7-54" width={1} height={1} />
      <rect id="rect-7-55" width={1} height={1} />
      <rect id="rect-7-56" width={1} height={1} />
      <rect id="rect-7-57" width={1} height={1} />
      <rect id="rect-7-58" width={1} height={1} />
      <rect id="rect-7-59" width={1} height={1} />
      <rect id="rect-7-60" width={1} height={1} />
      <rect id="rect-8-1" width={1} height={1} />
      <rect id="rect-8-2" width={1} height={1} />
      <rect id="rect-8-3" width={1} height={1} />
      <rect id="rect-8-4" width={1} height={1} />
      <rect id="rect-8-5" width={1} height={1} />
      <rect id="rect-8-6" width={1} height={1} />
      <rect id="rect-8-7" width={1} height={1} />
      <rect id="rect-8-8" width={1} height={1} />
      <rect id="rect-8-9" width={1} height={1} />
      <rect id="rect-8-10" width={1} height={1} />
      <rect id="rect-8-11" width={1} height={1} />
      <rect id="rect-8-12" width={1} height={1} />
      <rect id="rect-8-13" width={1} height={1} />
      <rect id="rect-8-14" width={1} height={1} />
      <rect id="rect-8-15" width={1} height={1} />
      <rect id="rect-8-16" width={1} height={1} />
      <rect id="rect-8-17" width={1} height={1} />
      <rect id="rect-8-18" width={1} height={1} />
      <rect id="rect-8-19" width={1} height={1} />
      <rect id="rect-8-20" width={1} height={1} />
      <rect id="rect-8-21" width={1} height={1} />
      <rect id="rect-8-22" width={1} height={1} />
      <rect id="rect-8-23" width={1} height={1} />
      <rect id="rect-8-24" width={1} height={1} />
      <rect id="rect-8-25" width={1} height={1} />
      <rect id="rect-8-26" width={1} height={1} />
      <rect id="rect-8-27" width={1} height={1} />
      <rect id="rect-8-28" width={1} height={1} />
      <rect id="rect-8-29" width={1} height={1} />
      <rect id="rect-8-30" width={1} height={1} />
      <rect id="rect-8-31" width={1} height={1} />
      <rect id="rect-8-32" width={1} height={1} />
      <rect id="rect-8-33" width={1} height={1} />
      <rect id="rect-8-34" width={1} height={1} />
      <rect id="rect-8-35" width={1} height={1} />
      <rect id="rect-8-36" width={1} height={1} />
      <rect id="rect-8-37" width={1} height={1} />
      <rect id="rect-8-38" width={1} height={1} />
      <rect id="rect-8-39" width={1} height={1} />
      <rect id="rect-8-40" width={1} height={1} />
      <rect id="rect-8-41" width={1} height={1} />
      <rect id="rect-8-42" width={1} height={1} />
      <rect id="rect-8-43" width={1} height={1} />
      <rect id="rect-8-44" width={1} height={1} />
      <rect id="rect-8-45" width={1} height={1} />
      <rect id="rect-8-46" width={1} height={1} />
      <rect id="rect-8-47" width={1} height={1} />
      <rect id="rect-8-48" width={1} height={1} />
      <rect id="rect-8-49" width={1} height={1} />
      <rect id="rect-8-50" width={1} height={1} />
      <rect id="rect-8-51" width={1} height={1} />
      <rect id="rect-8-52" width={1} height={1} />
      <rect id="rect-8-53" width={1} height={1} />
      <rect id="rect-8-54" width={1} height={1} />
      <rect id="rect-8-55" width={1} height={1} />
      <rect id="rect-8-56" width={1} height={1} />
      <rect id="rect-8-57" width={1} height={1} />
      <rect id="rect-8-58" width={1} height={1} />
      <rect id="rect-8-59" width={1} height={1} />
      <rect id="rect-8-60" width={1} height={1} />
    </svg>
  );
};

export default AnimateGradient;
