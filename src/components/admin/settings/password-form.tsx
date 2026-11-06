"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/actions/auth";
import { signOutEverywhere } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PASSWORD_MIN_LENGTH,
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/validations/auth";

export function PasswordForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await changePassword(values);
      if (!result.ok) {
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0])
            form.setError(name as keyof ChangePasswordValues, { message: messages[0] });
        }
        return void toast.error(result.error);
      }
      form.reset();
      toast.success("Password changed. Other devices have been signed out.");
    });
  });

  const fields = [
    { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
    { name: "newPassword", label: "New password", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
  ] as const;

  return (
    <section className="grid gap-6 rounded-lg border bg-surface p-6 lg:grid-cols-[16rem_1fr]">
      <div>
        <h2 className="font-semibold">Password & sessions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use at least {PASSWORD_MIN_LENGTH} characters. A passphrase of a few unrelated words works
          well.
        </p>
      </div>
      <div className="space-y-6">
        <form onSubmit={onSubmit} noValidate className="grid max-w-md gap-4">
          {fields.map(({ name, label, autoComplete }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={`pw-${name}`}>{label}</Label>
              <Input
                id={`pw-${name}`}
                type="password"
                autoComplete={autoComplete}
                aria-invalid={Boolean(errors[name])}
                {...form.register(name)}
              />
              {errors[name] && (
                <p className="text-[0.8125rem] text-destructive">{errors[name]?.message}</p>
              )}
            </div>
          ))}
          <div>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
              )}
              Change password
            </Button>
          </div>
        </form>
        <form
          action={signOutEverywhere}
          className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"
        >
          <p className="text-sm text-muted-foreground">Lost a device or used a shared computer?</p>
          <Button type="submit" variant="outline">
            Sign out everywhere
          </Button>
        </form>
      </div>
    </section>
  );
}
