import Image from "next/image";
import badge from "@/assets/brand/jeevan-cars-badge.png";
import { PreloaderController } from "@/components/brand/preloader-controller";

/**
 * First-visit brand moment for the homepage: the badge with a red ring that
 * sweeps like a rev counter, then wipes away to reveal the hero. Hidden by
 * default (see `.site-preloader` in globals.css); PRELOADER_BOOT_SCRIPT,
 * loaded from the root layout, decides whether it shows.
 */
export function SitePreloader() {
  return (
    <>
      <div
        id="site-preloader"
        className="site-preloader grain fixed inset-0 z-[100] flex-col items-center justify-center gap-10 bg-ink text-paper"
        role="status"
        aria-label="Loading Jeevan Cars"
      >
        <div className="preloader-stage flex flex-col items-center gap-10">
          <div className="relative grid size-56 place-items-center sm:size-64">
            <div
              aria-hidden
              className="preloader-glow absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(248,10,14,0.35)_0%,rgba(248,10,14,0.08)_45%,transparent_70%)]"
            />
            <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              <circle
                className="preloader-ring"
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="var(--brand-logo)"
                strokeWidth="1.6"
                strokeLinecap="round"
                pathLength={100}
              />
            </svg>
            <Image
              src={badge}
              alt=""
              width={208}
              height={208}
              sizes="(min-width: 640px) 208px, 176px"
              // Eager: on a first visit this badge is the page's LCP. On repeat
              // visits the overlay stays hidden and the badge is already cached.
              loading="eager"
              quality={90}
              className="preloader-badge relative size-44 drop-shadow-[0_18px_40px_rgba(0,0,0,0.6)] sm:size-52"
            />
          </div>
          <p className="preloader-caption label-caps text-paper/55">
            Pre-owned cars &amp; commercial vehicles
          </p>
        </div>
      </div>
      <PreloaderController />
    </>
  );
}
