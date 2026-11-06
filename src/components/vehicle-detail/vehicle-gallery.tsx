"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CarFront, ChevronLeft, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/media/smart-image";
import type { VehicleImageData } from "@/lib/data/vehicles";
import { cn } from "@/lib/utils";

type GalleryImage = VehicleImageData & { id: string };

/** Main image with crossfade, arrow-key and swipe navigation, plus a thumbnail strip. */
export function VehicleGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const current = images[index];

  if (!current) {
    return (
      <div className="flex aspect-[3/2] items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <CarFront className="size-14" strokeWidth={1} aria-hidden />
        <span className="sr-only">No photos available yet</span>
      </div>
    );
  }

  const go = (next: number) => setIndex((next + count) % count);

  return (
    <div
      className="space-y-3"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${title} photos`}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(index + 1);
        if (event.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="group relative aspect-[3/2] overflow-hidden rounded-lg bg-ink">
        <AnimatePresence initial={false}>
          <motion.div
            key={current.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(index + 1);
              else if (info.offset.x > 60) go(index - 1);
            }}
          >
            <SmartImage
              src={current.url}
              alt={current.altText ?? `${title} — photo ${index + 1}`}
              fill
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : undefined}
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="pointer-events-none object-cover select-none"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-md backdrop-blur transition-opacity hover:bg-surface sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-md backdrop-blur transition-opacity hover:bg-surface sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <p
              aria-live="polite"
              className="tabular absolute right-3 bottom-3 rounded-sm bg-ink/75 px-2 py-1 font-mono text-xs text-paper backdrop-blur"
            >
              {index + 1} / {count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Choose a photo">
          {images.map((image, thumbIndex) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(thumbIndex)}
                aria-label={`Show photo ${thumbIndex + 1}`}
                aria-current={thumbIndex === index ? "true" : undefined}
                className={cn(
                  "relative block aspect-[3/2] w-24 overflow-hidden rounded-md ring-offset-2 ring-offset-paper transition-[opacity,box-shadow] sm:w-28",
                  thumbIndex === index ? "ring-2 ring-ink" : "opacity-60 hover:opacity-100",
                )}
              >
                <SmartImage
                  src={image.url}
                  alt=""
                  fill
                  sizes="112px"
                  quality={60}
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
