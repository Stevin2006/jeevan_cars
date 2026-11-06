import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Prev/next pager for admin tables. `href` builds the URL for a page number. */
export function AdminPagination({
  page,
  pageCount,
  total,
  href,
}: {
  page: number;
  pageCount: number;
  total: number;
  href: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const linkClass =
    "inline-flex h-9 items-center gap-1 rounded-md border bg-surface px-3 text-sm hover:border-ink/30";
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount} · {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className={linkClass} rel="prev">
            <ChevronLeft className="size-4" aria-hidden /> Previous
          </Link>
        )}
        {page < pageCount && (
          <Link href={href(page + 1)} className={linkClass} rel="next">
            Next <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </nav>
  );
}
