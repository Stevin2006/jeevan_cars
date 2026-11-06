import { cn } from "@/lib/utils";

const DIGITS = 6;

export function toOdometerDigits(km: number): string[] {
  return String(Math.min(Math.max(Math.round(km), 0), 999_999))
    .padStart(DIGITS, "0")
    .split("");
}

/**
 * Kilometres driven as an odometer readout — the brand's signature detail.
 * Static and server-rendered; see AnimatedOdometer for the rolling version.
 */
export function Odometer({
  km,
  size = "sm",
  className,
}: {
  km: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const digits = toOdometerDigits(km);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`${km.toLocaleString("en-IN")} kilometres driven`}
      role="img"
    >
      <span
        aria-hidden
        className={cn(
          "tabular inline-flex overflow-hidden rounded-[3px] bg-ink font-mono text-paper ring-1 ring-ink/10",
          size === "sm" ? "text-[0.7rem] leading-5" : "text-sm leading-7",
        )}
      >
        {digits.map((digit, index) => (
          <span
            key={index}
            className={cn(
              "border-r border-white/10 text-center last:border-r-0",
              size === "sm" ? "w-[0.95em]" : "w-[1.15em]",
              index === DIGITS - 1 && "bg-amber text-ink",
            )}
          >
            {digit}
          </span>
        ))}
      </span>
      <span aria-hidden className="label-caps text-muted-foreground">
        km
      </span>
    </span>
  );
}
