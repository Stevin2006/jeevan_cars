"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/** Counts up to `value` once when first visible; renders the final value without JS. */
export function StatCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduceMotion || value === 0) return;
    const controls = animate(0, value, {
      duration: Math.min(1.2, 0.4 + value / 100),
      ease: [0.25, 1, 0.5, 1],
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString("en-IN");
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  return (
    <span ref={ref} className="tabular">
      {value.toLocaleString("en-IN")}
    </span>
  );
}
