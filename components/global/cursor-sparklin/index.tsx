"use client";
import React, { useRef, useEffect } from "react";

interface ClickSparkProps {
  activeOn?: string;
}

const ClickSpark: React.FC<ClickSparkProps> = ({ activeOn }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const setSparkPosition = (e: MouseEvent) => {
    if (!svgRef.current) return;

    svgRef.current.style.left = `${e.clientX}px`;
    svgRef.current.style.top = `${e.clientY}px`;
  };

  const animateSpark = () => {
    if (!svgRef.current) return;

    const sparks = Array.from(svgRef.current.children) as SVGLineElement[];
    const size = parseInt(sparks[0].getAttribute("y1") || "0");
    const offset = `${size / 2}px`;

    const options = {
      duration: 660,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      fill: "forwards" as FillMode,
    };

    sparks.forEach((spark, i) => {
      const deg = `calc(${i} * (360deg / ${sparks.length}))`;
      const keyframes = [
        {
          strokeDashoffset: size * 3,
          transform: `rotate(${deg}) translateY(${offset})`,
        },
        {
          strokeDashoffset: size,
          transform: `rotate(${deg}) translateY(0)`,
        },
      ];
      spark.animate(keyframes, options);
    });
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (activeOn && target && !target.matches(activeOn)) return;
      setSparkPosition(e);
      animateSpark();
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [activeOn]);

  return (
    <div
      aria-hidden="true"
      style={{
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        position: "fixed",
        zIndex: 999999999,
      }}
    >
      <svg
        ref={svgRef}
        width="30"
        height="30"
        viewBox="0 0 100 100"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: 0,
          top: 0,
          stroke: "var(--foreground)",
          transform: "translate(-50%, -50%) rotate(-20deg)",
        }}
        className="dark:stroke-white stroke-black"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <line
            key={index}
            x1="50"
            y1="30"
            x2="50"
            y2="4"
            style={{
              strokeDasharray: "30",
              strokeDashoffset: "30",
              transformOrigin: "center",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default ClickSpark;
