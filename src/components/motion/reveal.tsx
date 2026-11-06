"use client";

import { motion, type HTMLMotionProps } from "motion/react";

type RevealProps = HTMLMotionProps<"div"> & {
  /** Seconds to wait after the element enters the viewport. */
  delay?: number;
  /** Vertical travel in px. */
  distance?: number;
};

/** Fades and lifts content in once when it scrolls into view. */
export function Reveal({ delay = 0, distance = 24, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 1, 0.5, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
