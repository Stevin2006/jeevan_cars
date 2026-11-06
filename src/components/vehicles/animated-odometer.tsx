"use client";

import { motion } from "motion/react";
import { toOdometerDigits } from "@/components/vehicles/odometer";
import { cn } from "@/lib/utils";

const STRIP = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Large odometer whose digit wheels roll into place once when scrolled into view. */
export function AnimatedOdometer({ km, className }: { km: number; className?: string }) {
  const digits = toOdometerDigits(km);

  return (
    <div className={cn("flex items-end gap-3", className)}>
      <motion.div
        role="img"
        aria-label={`${km.toLocaleString("en-IN")} kilometres driven`}
        className="tabular inline-flex overflow-hidden rounded-md bg-ink p-1 font-mono text-2xl text-paper shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] sm:text-3xl"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true }}
      >
        {digits.map((digit, index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              "relative h-[1.5em] w-[1.05em] overflow-hidden border-r border-white/10 last:border-r-0",
              index === digits.length - 1 && "rounded-r-sm bg-amber text-ink",
            )}
          >
            <motion.span
              className="absolute inset-x-0 top-0 flex flex-col items-center"
              variants={{
                hidden: { y: "0%" },
                shown: { y: `${-Number(digit) * 10}%` },
              }}
              transition={{ duration: 1.1, delay: index * 0.08, ease: [0.25, 1, 0.5, 1] }}
            >
              {STRIP.map((value) => (
                <span key={value} className="flex h-[1.5em] items-center">
                  {value}
                </span>
              ))}
            </motion.span>
          </span>
        ))}
      </motion.div>
      <span className="pb-1 label-caps text-muted-foreground">km driven</span>
    </div>
  );
}
