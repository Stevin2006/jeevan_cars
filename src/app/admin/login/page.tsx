import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/brand/logo";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getSession()) redirect("/admin/dashboard");
  const { next } = await searchParams;

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
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
      </div>
    </div>
  );
}
