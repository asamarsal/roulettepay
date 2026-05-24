"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Direction = "left" | "right" | "top" | "bottom" | "fade";

function getOffset(direction: Direction) {
  const distance = 64;

  if (direction === "left") return { x: -distance, y: 0 };
  if (direction === "right") return { x: distance, y: 0 };
  if (direction === "top") return { x: 0, y: -distance };
  if (direction === "bottom") return { x: 0, y: distance };

  return { x: 0, y: 0 };
}

export function useScrollReveal() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        const direction = (el.dataset.reveal || "bottom") as Direction;
        const delay = Number(el.dataset.delay || 0);
        const offset = getOffset(direction);

        gsap.fromTo(
          el,
          {
            autoAlpha: 0,
            x: offset.x,
            y: offset.y,
            scale: direction === "fade" ? 0.98 : 1,
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.9,
            delay,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 84%",
              end: "bottom 16%",
              toggleActions: "play reverse play reverse",
            },
          },
        );
      });
    });

    return () => ctx.revert();
  }, []);
}
