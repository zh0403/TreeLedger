"use client";

import { useEffect } from "react";

/** Progressive enhancement: all copy stays readable without JavaScript. */
export function ScrollReveals() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: .12 });
    elements.forEach((element) => {
      // Never hide content already in the viewport while hydration completes.
      if (element.getBoundingClientRect().top < window.innerHeight) element.classList.add("is-visible");
      element.classList.add("reveal-enabled");
      observer.observe(element);
    });
    return () => {
      observer.disconnect();
      elements.forEach((element) => element.classList.remove("reveal-enabled"));
    };
  }, []);
  return null;
}
