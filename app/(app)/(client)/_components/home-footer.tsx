"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  bodyTextClass,
  createExplosionParticle,
  displayTextClass,
  featuredImagePaths,
  footerColumns,
  monoTextClass,
} from "./home-config";

export function HomeFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const explosionContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const footer = footerRef.current;
    const explosionContainer = explosionContainerRef.current;

    if (!footer || !explosionContainer) {
      return;
    }

    const config = {
      gravity: 0.25,
      friction: 0.99,
      horizontalForce: 20,
      verticalForce: 15,
      rotationSpeed: 10,
    };

    featuredImagePaths.forEach((path) => {
      const image = new Image();
      image.src = path;
    });

    const createParticles = () => {
      explosionContainer.innerHTML = "";

      featuredImagePaths.forEach((path) => {
        const particle = document.createElement("img");
        particle.src = path;
        particle.className =
          "absolute bottom-[-200px] left-1/2 h-auto w-[150px] -translate-x-1/2 rounded-[1rem] object-cover will-change-transform";
        explosionContainer.appendChild(particle);
      });
    };

    let hasExploded = false;
    let animationFrameId = 0;
    let checkTimeout = 0;

    const explode = () => {
      if (hasExploded) {
        return;
      }

      hasExploded = true;
      createParticles();

      const particles = Array.from(
        explosionContainer.querySelectorAll<HTMLImageElement>("img"),
      ).map((element) => createExplosionParticle(element, config));

      const animate = () => {
        particles.forEach((particle) => particle.update());
        animationFrameId = window.requestAnimationFrame(animate);

        if (
          particles.every(
            (particle) => particle.y > explosionContainer.offsetHeight / 2,
          )
        ) {
          window.cancelAnimationFrame(animationFrameId);
        }
      };

      animate();
    };

    const checkFooterPosition = () => {
      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (footerRect.top > viewportHeight + 100) {
        hasExploded = false;
      }

      if (!hasExploded && footerRect.top <= viewportHeight + 250) {
        explode();
      }
    };

    const handleScroll = () => {
      window.clearTimeout(checkTimeout);
      checkTimeout = window.setTimeout(checkFooterPosition, 5);
    };

    const handleResize = () => {
      hasExploded = false;
    };

    createParticles();
    const initialTimeoutId = window.setTimeout(checkFooterPosition, 500);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearTimeout(checkTimeout);
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleInternalLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    target: string,
  ) => {
    event.preventDefault();

    if (pathname === "/") {
      if (target === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const targetElement = document.getElementById(target);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }
    }

    router.push(target === "top" ? "/" : `/#${target}`);
  };

  return (
    <footer
      ref={footerRef}
      className="relative flex h-[85svh] w-screen flex-col items-center justify-between overflow-hidden p-[2em] text-[var(--otis-bg)] bg-[var(--otis-bg)] max-[1000px]:h-[100svh]"
    >
      <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2em] bg-[var(--otis-fg)] p-[2em]">
        <div className="absolute left-0 top-0 flex w-full justify-between p-[2em]">
          <img
            src="/images/global/s6.png"
            alt=""
            className="h-[1rem] w-auto object-contain"
          />
          <img
            src="/images/global/s6.png"
            alt=""
            className="h-[1rem] w-auto object-contain"
          />
        </div>

        <div className="absolute bottom-0 left-0 flex w-full justify-between p-[2em]">
          <img
            src="/images/global/s6.png"
            alt=""
            className="h-[1rem] w-auto object-contain"
          />
          <img
            src="/images/global/s6.png"
            alt=""
            className="h-[1rem] w-auto object-contain"
          />
        </div>

        <div className="relative text-center">
          <h1 className={`${displayTextClass} text-[clamp(3rem,8vw,7rem)]`}>
            Ancs Studio
          </h1>
        </div>

        <div className="mb-[8em] flex gap-[2em] max-[1000px]:mb-[2em] max-[1000px]:flex-col">
          {footerColumns.map((column, columnIndex) => (
            <div
              key={column.title}
              className={`flex flex-1 flex-col items-center gap-[1em] ${
                columnIndex === 1 || columnIndex === 3 ? "max-[1000px]:hidden" : ""
              }`}
            >
              <p className={bodyTextClass}>{column.title}</p>

              {column.items.map((item) => {
                if ("href" in item && item.href) {
                  return (
                    <a
                      key={`${column.title}-${item.label}`}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`${bodyTextClass} opacity-[0.35]`}
                    >
                      {item.label}
                    </a>
                  );
                }

                if ("target" in item && item.target) {
                  const target = item.target;

                  return (
                    <a
                      key={`${column.title}-${item.label}`}
                      href={`#${target}`}
                      onClick={(event) => handleInternalLinkClick(event, target)}
                      className={`${bodyTextClass} opacity-[0.35]`}
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <p
                    key={`${column.title}-${item.label}`}
                    className={`${bodyTextClass} opacity-[0.35]`}
                  >
                    {item.label}
                  </p>
                );
              })}
            </div>
          ))}
        </div>

        <div className="relative flex w-full justify-center gap-[2em] max-[1000px]:flex-col max-[1000px]:gap-[0.5em] max-[1000px]:text-center">
          <p className={monoTextClass}>MWT - MAY 2026</p>
          <p className={`${monoTextClass} max-[1000px]:hidden`}>{"//"}</p>
          <p className={monoTextClass}>
            Built by{" "}
            <a
              href="https://www.youtube.com/@admin12121"
              target="_blank"
              rel="noreferrer"
            >
              Admin12121
            </a>
          </p>
        </div>

        <div
          ref={explosionContainerRef}
          className="pointer-events-none absolute bottom-0 left-0 h-[200%] w-full overflow-hidden max-[1000px]:hidden"
        />
      </div>
    </footer>
  );
}
