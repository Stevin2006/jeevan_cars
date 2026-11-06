import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Styled native <select>: works without JavaScript, gets the platform picker on
 * phones, and submits as a normal GET field.
 */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        {...props}
        className="h-10 w-full appearance-none rounded-md border border-input bg-surface pr-9 pl-3 text-sm text-ink transition-colors outline-none hover:border-ink/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
