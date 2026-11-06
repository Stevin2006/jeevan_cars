"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export function LoginForm({ next }: { next?: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", next },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      // On success the action redirects, so only failures return here.
      const result = await login({ ...values, next });
      if (!result.ok) {
        setError(result.error);
        form.setValue("password", "");
        form.setFocus("password");
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="username"
          autoFocus
          className="h-11 bg-surface"
          aria-invalid={Boolean(errors.email)}
          {...form.register("email")}
        />
        {errors.email && (
          <p className="text-[0.8125rem] text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="h-11 bg-surface pr-11"
            aria-invalid={Boolean(errors.password)}
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-ink"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[0.8125rem] text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" size="xl" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
