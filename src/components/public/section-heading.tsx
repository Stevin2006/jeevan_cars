import { cn } from "@/lib/utils";

/** Eyebrow + display heading + optional lede, used to open every public section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "dark",
  align = "left",
  as: Heading = "h2",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: "dark" | "light";
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={cn("max-w-2xl space-y-4", align === "center" && "mx-auto text-center", className)}
    >
      {eyebrow && (
        <p
          className={cn(
            "flex items-center gap-3 label-caps",
            align === "center" && "justify-center",
            tone === "light" ? "text-amber" : "text-amber-ink",
          )}
        >
          <span aria-hidden className="h-px w-6 bg-current" />
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn(
          "font-display text-3xl leading-[1.05] font-bold text-balance sm:text-4xl lg:text-[2.75rem]",
          tone === "light" ? "text-paper" : "text-ink",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            "text-base leading-relaxed text-pretty sm:text-lg",
            tone === "light" ? "text-paper/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
