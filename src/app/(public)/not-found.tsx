import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Odometer } from "@/components/vehicles/odometer";

export default function NotFound() {
  return (
    <div className="container-page flex flex-1 flex-col items-start justify-center gap-6 pt-[calc(var(--nav-height)+4rem)] pb-24">
      <Odometer km={404} size="md" />
      <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Wrong turn.</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        We couldn&rsquo;t find that page. If you followed a link to a vehicle, it may have been sold
        or removed.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="xl">
          <Link href="/vehicles">Browse vehicles</Link>
        </Button>
        <Button asChild variant="outline" size="xl">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
