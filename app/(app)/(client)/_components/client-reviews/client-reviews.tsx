"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import clientReviewsContent from "./client-reviews-content";

gsap.registerPlugin(SplitText);

export default function ClientReviews() {
  const [activeClient, setActiveClient] = useState(0);
  const [visualClient, setVisualClient] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const clientRefs = useRef<Array<HTMLDivElement | null>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const reviewTextRef = useRef<HTMLHeadingElement>(null);
  const splitTextRef = useRef<SplitText | null>(null);
  const clientInfoRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const getExpandedWidth = () => {
    if (!containerRef.current) {
      return "10rem";
    }

    const containerWidth = containerRef.current.offsetWidth;
    const padding = 16;
    const gap = 4;
    const inactiveItemWidth = 48;
    const inactiveItems = clientReviewsContent.length - 1;

    const remainingSpace =
      containerWidth -
      padding -
      inactiveItemWidth * inactiveItems -
      gap * inactiveItems;

    return `${remainingSpace}px`;
  };

  const animateImageChange = (newImageSrc: string) => {
    if (!imageContainerRef.current) {
      return;
    }

    const newImg = document.createElement("img");
    newImg.src = newImageSrc;
    newImg.alt = "";
    newImg.style.opacity = "0";

    imageContainerRef.current.appendChild(newImg);

    return gsap.to(newImg, {
      opacity: 1,
      duration: 1,
      delay: 0.5,
      ease: "power2.out",
      onComplete: () => {
        const allImages = imageContainerRef.current?.querySelectorAll("img") ?? [];
        allImages.forEach((img) => {
          if (img !== newImg) {
            img.remove();
          }
        });
      },
    });
  };

  useEffect(() => {
    gsap.set(clientRefs.current, {
      width: "3rem",
    });

    gsap.set(clientInfoRefs.current, {
      opacity: 0,
    });

    if (clientRefs.current[0]) {
      const expandedWidth = getExpandedWidth();
      gsap.to(clientRefs.current[0], {
        width: expandedWidth,
        duration: 0.75,
        ease: "power4.inOut",
      });
    }

    if (clientInfoRefs.current[0]) {
      gsap.to(clientInfoRefs.current[0], {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    const initTimer = window.setTimeout(() => {
      if (!reviewTextRef.current) {
        return;
      }

      splitTextRef.current = SplitText.create(reviewTextRef.current, {
        type: "lines",
        mask: "lines",
      });

      if (splitTextRef.current?.lines) {
        gsap.set(splitTextRef.current.lines, { y: "110%" });
        gsap.to(splitTextRef.current.lines, {
          y: "0%",
          duration: 0.5,
          stagger: 0.05,
          ease: "power4.out",
        });
      }
    }, 100);

    return () => {
      window.clearTimeout(initTimer);
      splitTextRef.current?.revert();
      splitTextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!splitTextRef.current || !reviewTextRef.current) {
      return;
    }

    splitTextRef.current.revert();
    splitTextRef.current = SplitText.create(reviewTextRef.current, {
      type: "lines",
      mask: "lines",
    });

    if (splitTextRef.current.lines) {
      gsap.set(splitTextRef.current.lines, { y: "110%" });
      gsap.to(splitTextRef.current.lines, {
        y: "0%",
        duration: 0.5,
        stagger: 0.05,
        ease: "power4.out",
      });
    }
  }, [activeClient]);

  const handleClientClick = (index: number) => {
    if (index === activeClient || isAnimating) {
      return;
    }

    masterTimelineRef.current?.kill();
    setIsAnimating(true);

    const expandedWidth = getExpandedWidth();
    masterTimelineRef.current = gsap.timeline();
    const tl = masterTimelineRef.current;

    if (clientInfoRefs.current[visualClient]) {
      tl.to(
        clientInfoRefs.current[visualClient],
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        0,
      );
    }

    tl.to(
      clientRefs.current[activeClient],
      {
        width: "3rem",
        duration: 0.75,
        ease: "power4.inOut",
      },
      0,
    ).to(
      clientRefs.current[index],
      {
        width: expandedWidth,
        duration: 0.75,
        ease: "power4.inOut",
      },
      0,
    );

    tl.call(
      () => {
        setVisualClient(index);
      },
      [],
      0.2,
    );

    tl.to(
      {},
      {
        duration: 0.1,
        onComplete: () => {
          if (!clientInfoRefs.current[index]) {
            return;
          }

          const clientInfoAnim = gsap.to(clientInfoRefs.current[index], {
            opacity: 0,
            duration: 0,
            ease: "power2.out",
            onComplete: () => {
              if (clientInfoRefs.current[index]) {
                gsap.to(clientInfoRefs.current[index], {
                  opacity: 1,
                  duration: 0.5,
                  ease: "power2.out",
                });
              }
            },
          });

          tl.add(clientInfoAnim, 0.5);
        },
      },
      0.5,
    );

    const imageAnimation = animateImageChange(clientReviewsContent[index].image);
    if (imageAnimation) {
      tl.add(imageAnimation, 0);
    }

    if (splitTextRef.current?.lines) {
      const textOutAnim = gsap.to(splitTextRef.current.lines, {
        y: "-110%",
        duration: 0.5,
        stagger: 0.05,
        ease: "power4.in",
        onComplete: () => {
          setActiveClient(index);
        },
      });
      tl.add(textOutAnim, 0);
    } else {
      setActiveClient(index);
    }

    tl.call(() => {
      window.setTimeout(() => {
        setIsAnimating(false);
        masterTimelineRef.current = null;
      }, 250);
    });
  };

  return (
    <div className="client-reviews">
      <div className="container">
        <div className="client-reviews-wrapper">
          <div className="client-review-content">
            <div className="client-review-img" ref={imageContainerRef}>
              <img src={clientReviewsContent[activeClient].image} alt="" />
            </div>
            <div className="client-review-copy">
              <h3 ref={reviewTextRef} key={activeClient}>
                {clientReviewsContent[activeClient].review}
              </h3>
            </div>
          </div>
          <div className="clients-list" ref={containerRef}>
            {clientReviewsContent.map((client, index) => (
              <div
                key={client.id}
                ref={(element) => {
                  clientRefs.current[index] = element;
                }}
                className={`client-item ${index === visualClient ? "active" : ""} ${
                  isAnimating ? "animating" : ""
                }`}
                onClick={() => handleClientClick(index)}
              >
                <div className="client-avatar">
                  <img src={client.avatar} alt={client.name} />
                </div>
                {index === visualClient ? (
                  <div
                    className="client-info"
                    ref={(element) => {
                      clientInfoRefs.current[index] = element;
                    }}
                    style={{ opacity: 0 }}
                  >
                    <p className="client-name md">{client.name}</p>
                    <p className="client-title">{client.title}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
