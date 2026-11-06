import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildCatalogueHref, type CatalogueParams } from "@/lib/validations/catalogue-params";
import { cn } from "@/lib/utils";

/** 1 … 4 5 [6] 7 8 … 20 */
function getPageItems(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return sorted.flatMap((p, index) => {
    const previous = sorted[index - 1];
    return previous !== undefined && p - previous > 1 ? ["gap" as const, p] : [p];
  });
}

export function Pagination({ params, pageCount }: { params: CatalogueParams; pageCount: number }) {
  if (pageCount <= 1) return null;
  const { page } = params;
  const href = (target: number) => buildCatalogueHref({ ...params, page: target });
  const arrowClass =
    "inline-flex h-10 items-center gap-1.5 rounded-md border bg-surface px-3 text-sm font-medium transition-colors hover:border-ink/30";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 border-t pt-8">
      {page > 1 ? (
        <Link href={href(page - 1)} className={arrowClass} rel="prev">
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </Link>
      ) : (
        <span />
      )}

      <ol className="hidden items-center gap-1 sm:flex">
        {getPageItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden className="px-2 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={href(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  "tabular inline-flex size-10 items-center justify-center rounded-md font-mono text-sm transition-colors",
                  item === page ? "bg-ink text-paper" : "hover:bg-muted",
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>
      <p className="text-sm text-muted-foreground sm:hidden">
        Page {page} of {pageCount}
      </p>

      {page < pageCount ? (
        <Link href={href(page + 1)} className={arrowClass} rel="next">
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
