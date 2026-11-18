"use client";

import { useEffect } from "react";

const MIN_VISIBLE_MS = 1300; // let the ring sweep finish
const MAX_VISIBLE_MS = 3000; // never hold the page longer than this
const EXIT_MS = 850; // matches the clip-path transition in globals.css

/**
 * Lifts the preloader once the page has loaded (or after a maximum wait).
 * Does nothing unless the boot script started it on this page load.
 */
export function PreloaderController() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-preloading") !== "active") return;

    const started = performance.now();
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let doneTimer: ReturnType<typeof setTimeout> | undefined;

    const leave = () => {
      if (root.getAttribute("data-preloading") !== "active") return;
      root.setAttribute("data-preloading", "leaving");
      doneTimer = setTimeout(() => root.removeAttribute("data-preloading"), EXIT_MS);
    };

    const scheduleLeave = () => {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started));
      exitTimer = setTimeout(leave, remaining);
    };

    const maxTimer = setTimeout(leave, MAX_VISIBLE_MS);
    if (document.readyState === "complete") scheduleLeave();
    else window.addEventListener("load", scheduleLeave, { once: true });

    return () => {
      window.removeEventListener("load", scheduleLeave);
      clearTimeout(maxTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
      // Navigated away before it finished: never leave the next page scroll-locked.
      // (React's dev double-mount keeps the overlay connected, so it's unaffected.)
      if (!document.getElementById("site-preloader")?.isConnected) {
        root.removeAttribute("data-preloading");
      }
    };
  }, []);

  return null;
}
