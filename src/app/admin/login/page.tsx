import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Request-time part of the page: bounce visitors who are already signed in,
 * and carry the `next` destination into the form. Streams in behind a
 * skeleton so the rest of the page is a prerendered shell.
 */
async function LoginGate({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  if (await getSession()) redirect("/admin/dashboard");
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading sign-in form">
      {[0, 1].map((field) => (
        <div key={field} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="grid min-h-svh flex-1 lg:grid-cols-2">
      <div className="grain relative hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <Logo tone="light" />
        <div className="space-y-4">
          <p className="label-caps text-amber">Dealer console</p>
          <p className="max-w-md font-display text-4xl leading-[1.05] font-bold">
            Manage stock, pricing and enquiries in one place.
          </p>
        </div>
        <p className="text-sm text-paper/40">Authorised staff only. Activity is logged.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="lg:hidden">
              <Logo />
            </div>
            <h1 className="pt-6 font-display text-2xl font-bold lg:pt-0">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Use your administrator email and password.
            </p>
          </div>
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginGate searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
