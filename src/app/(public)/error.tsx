"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-1 flex-col items-start justify-center gap-6 pt-[calc(var(--nav-height)+4rem)] pb-24">
      <p className="label-caps text-brand-ink">Something went wrong</p>
      <h1 className="font-display text-4xl font-extrabold">We hit a bump in the road.</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        This page didn&rsquo;t load properly. Please try again — if it keeps happening, give us a
        call.
      </p>
      <Button size="xl" onClick={reset}>
        <RotateCcw data-icon="inline-start" aria-hidden />
        Try again
      </Button>
    </div>
  );
}
