"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { submitEnquiry } from "@/actions/enquiries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enquiryFormSchema, type EnquiryFormValues } from "@/lib/validations/enquiry";
import { cn } from "@/lib/utils";

type EnquiryFormProps = {
  source: "VEHICLE_PAGE" | "CONTACT_PAGE";
  vehicleId?: string;
  defaultMessage?: string;
  submitLabel?: string;
  className?: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[0.8125rem] text-destructive">
      {message}
    </p>
  );
}

export function EnquiryForm({
  source,
  vehicleId,
  defaultMessage = "",
  submitLabel = "Send enquiry",
  className,
}: EnquiryFormProps) {
  const id = useId();
  const openedAt = useRef(0);
  const [isPending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: { name: "", phone: "", email: "", message: defaultMessage },
    mode: "onTouched",
  });
  const { errors } = form.formState;

  function send(values: EnquiryFormValues, website: string, elapsedMs: number) {
    startTransition(async () => {
      const result = await submitEnquiry({
        ...values,
        source,
        vehicleId,
        website,
        elapsedMs,
      });

      if (result.ok) {
        setSentTo(values.name.split(" ")[0] ?? values.name);
        form.reset({ name: "", phone: "", email: "", message: defaultMessage });
        return;
      }
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0] && field in values) {
          form.setError(field as keyof EnquiryFormValues, { message: messages[0] });
        }
      }
      toast.error(result.error);
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const website = String(new FormData(event.currentTarget).get("website") ?? "");
    const elapsedMs = Date.now() - openedAt.current;
    void form.handleSubmit((values) => send(values, website, elapsedMs))(event);
  }

  const describedBy = (field: keyof EnquiryFormValues) =>
    errors[field] ? `${id}-${field}-error` : undefined;

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {sentTo ? (
          <motion.div
            key="sent"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-start gap-4 rounded-lg border bg-surface p-6"
          >
            <CheckCircle2 className="size-8 text-status-available" strokeWidth={1.5} aria-hidden />
            <div className="space-y-1">
              <p className="font-display text-lg font-bold">
                Thanks, {sentTo} — we&rsquo;ve got it.
              </p>
              <p className="text-sm text-muted-foreground">
                Someone from our team will call you back shortly, usually within a few working
                hours.
              </p>
            </div>
            <Button variant="outline" onClick={() => setSentTo(null)}>
              Send another enquiry
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
            aria-busy={isPending}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>Your name</Label>
                <Input
                  id={`${id}-name`}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy("name")}
                  className="h-11 bg-surface"
                  {...form.register("name")}
                />
                <FieldError id={`${id}-name-error`} message={errors.name?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-phone`}>Mobile number</Label>
                <Input
                  id={`${id}-phone`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={describedBy("phone")}
                  className="h-11 bg-surface"
                  {...form.register("phone")}
                />
                <FieldError id={`${id}-phone-error`} message={errors.phone?.message} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>
                Email <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id={`${id}-email`}
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={describedBy("email")}
                className="h-11 bg-surface"
                {...form.register("email")}
              />
              <FieldError id={`${id}-email-error`} message={errors.email?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${id}-message`}>Message</Label>
              <Textarea
                id={`${id}-message`}
                rows={4}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={describedBy("message")}
                className="min-h-28 bg-surface"
                {...form.register("message")}
              />
              <FieldError id={`${id}-message-error`} message={errors.message?.message} />
            </div>

            {/* Honeypot — invisible to people and assistive tech. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor={`${id}-website`}>Website</label>
              <input
                id={`${id}-website`}
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                We only use your details to reply to this enquiry.
              </p>
              <Button type="submit" size="xl" disabled={isPending} className="sm:min-w-44">
                {isPending ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
                ) : (
                  <Send data-icon="inline-start" aria-hidden />
                )}
                {isPending ? "Sending…" : submitLabel}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
