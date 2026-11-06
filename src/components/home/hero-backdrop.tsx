"use client";

import { motion } from "motion/react";

/** Slow settle of the hero photograph — plays once, never loops. */
export function HeroBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0"
      // Scale only: the photo is the LCP element, so it must be visible at first paint.
      initial={{ scale: 1.08 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2.4, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
