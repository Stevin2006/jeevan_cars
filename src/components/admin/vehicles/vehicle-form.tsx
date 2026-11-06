"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createVehicle, updateVehicle } from "@/actions/vehicles";
import { ImageManager } from "@/components/admin/vehicles/image-manager";
import { NativeSelect } from "@/components/catalogue/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { TaxonomyOptions, VehicleForEdit } from "@/lib/data/admin";
import {
  AVAILABILITY_LABELS,
  CONDITION_LABELS,
  CONTACT_FOR_PRICE,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  formatINR,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  vehicleFormSchema,
  type VehicleFormInput,
  type VehicleFormValues,
} from "@/lib/validations/vehicle";

type FormInput = VehicleFormInput;

function toFormDefaults(vehicle?: VehicleForEdit): FormInput {
  if (!vehicle) {
    return {
      name: "",
      slug: "",
      categoryId: "",
      brandId: "",
      model: "",
      variant: "",
      description: "",
      manufacturingYear: "",
      registrationYear: "",
      kilometresDriven: "",
      fuelType: "" as never,
      transmission: "" as never,
      ownershipCount: 1,
      condition: "GOOD",
      colour: "",
      seatingCapacity: "",
      specifications: [],
      price: "",
      showPrice: true,
      status: "DRAFT",
      availability: "AVAILABLE",
      isFeatured: false,
      registrationNumber: "",
      internalNotes: "",
      images: [],
    };
  }
  return {
    name: vehicle.name,
    slug: vehicle.slug,
    categoryId: vehicle.categoryId,
    brandId: vehicle.brandId,
    model: vehicle.model,
    variant: vehicle.variant ?? "",
    description: vehicle.description,
    manufacturingYear: vehicle.manufacturingYear,
    registrationYear: vehicle.registrationYear ?? "",
    kilometresDriven: vehicle.kilometresDriven,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    ownershipCount: vehicle.ownershipCount,
    condition: vehicle.condition,
    colour: vehicle.colour ?? "",
    seatingCapacity: vehicle.seatingCapacity ?? "",
    specifications: vehicle.specifications.map(({ group, label, value }) => ({
      group,
      label,
      value,
    })),
    price: vehicle.price ?? "",
    showPrice: vehicle.showPrice,
    status: vehicle.status,
    availability: vehicle.availability,
    isFeatured: vehicle.isFeatured,
    registrationNumber: vehicle.registrationNumber ?? "",
    internalNotes: vehicle.internalNotes ?? "",
    images: vehicle.images.map((image) => ({
      publicId: image.publicId,
      url: image.url,
      width: image.width,
      height: image.height,
      bytes: image.bytes,
      altText: image.altText ?? "",
      isPrimary: image.isPrimary,
    })),
  };
}

function Section({
  title,
  description,
  children,
  icon,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-surface">
      <header className="border-b px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold">
          {icon}
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function VehicleForm({
  vehicle,
  options,
}: {
  vehicle?: VehicleForEdit;
  options: TaxonomyOptions;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormInput, unknown, VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: toFormDefaults(vehicle),
    mode: "onTouched",
  });
  const { register, control, formState } = form;
  const { errors, isDirty } = formState;
  const specs = useFieldArray({ control, name: "specifications" });

  const [showPrice, price, brandId, model, variant, status] = useWatch({
    control,
    name: ["showPrice", "price", "brandId", "model", "variant", "status"],
  });
  const brandName = options.brands.find((brand) => brand.id === brandId)?.name;
  const autoName = [brandName, model, variant].filter(Boolean).join(" ");
  const priceNumber = Number(price);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const err = (name: FieldPath<FormInput>) => {
    const parts = name.split(".");
    let node: unknown = errors;
    for (const part of parts) node = (node as Record<string, unknown> | undefined)?.[part];
    return (node as { message?: string } | undefined)?.message;
  };
  const aria = (name: FieldPath<FormInput>) => ({
    "aria-invalid": Boolean(err(name)),
    "aria-describedby": err(name) ? `${name}-error` : undefined,
  });

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        const result = vehicle
          ? await updateVehicle(vehicle.id, values)
          : await createVehicle(values);
        if (!result.ok) {
          for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
            if (messages?.[0])
              form.setError(field as FieldPath<FormInput>, { message: messages[0] });
          }
          toast.error(result.error);
          return;
        }
        form.reset(form.getValues());
        toast.success(vehicle ? "Changes saved" : "Vehicle created");
        if (vehicle) router.refresh();
        else router.push(`/admin/vehicles/${result.data.id}/edit`);
      });
    },
    () => toast.error("Some fields need attention."),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        <Section
          title="Photos"
          description="Upload clear, well-lit photos. The first impression sells the car."
        >
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ImageManager
                value={(field.value ?? []) as never}
                onChange={(images) => field.onChange(images)}
                error={err("images")}
              />
            )}
          />
        </Section>

        <Section title="Basics">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" htmlFor="categoryId" error={err("categoryId")}>
              <NativeSelect id="categoryId" {...register("categoryId")} {...aria("categoryId")}>
                <option value="">Choose a category</option>
                {options.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {!category.isActive && " (hidden)"}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Brand" htmlFor="brandId" error={err("brandId")}>
              <NativeSelect id="brandId" {...register("brandId")} {...aria("brandId")}>
                <option value="">Choose a brand</option>
                {options.brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                    {!brand.isActive && " (hidden)"}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Model" htmlFor="model" error={err("model")}>
              <Input
                id="model"
                placeholder="e.g. Creta"
                {...register("model")}
                {...aria("model")}
              />
            </Field>
            <Field
              label="Variant"
              htmlFor="variant"
              error={err("variant")}
              hint="Optional, e.g. SX(O) 1.5 Diesel"
            >
              <Input id="variant" {...register("variant")} {...aria("variant")} />
            </Field>
          </div>
          <Field
            label="Listing title"
            htmlFor="name"
            error={err("name")}
            hint={
              autoName
                ? `Leave blank to use “${autoName}”`
                : "Leave blank to build it from brand, model and variant"
            }
          >
            <Input
              id="name"
              placeholder={autoName || undefined}
              {...register("name")}
              {...aria("name")}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            error={err("description")}
            hint="Condition, service history, features and anything a buyer should know. Line breaks are kept."
          >
            <Textarea
              id="description"
              rows={7}
              {...register("description")}
              {...aria("description")}
            />
          </Field>
        </Section>

        <Section title="Specifications">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              label="Manufacturing year"
              htmlFor="manufacturingYear"
              error={err("manufacturingYear")}
            >
              <Input
                id="manufacturingYear"
                type="number"
                inputMode="numeric"
                {...register("manufacturingYear")}
                {...aria("manufacturingYear")}
              />
            </Field>
            <Field
              label="Registration year"
              htmlFor="registrationYear"
              error={err("registrationYear")}
              hint="Optional"
            >
              <Input
                id="registrationYear"
                type="number"
                inputMode="numeric"
                {...register("registrationYear")}
                {...aria("registrationYear")}
              />
            </Field>
            <Field
              label="Kilometres driven"
              htmlFor="kilometresDriven"
              error={err("kilometresDriven")}
            >
              <Input
                id="kilometresDriven"
                type="number"
                inputMode="numeric"
                {...register("kilometresDriven")}
                {...aria("kilometresDriven")}
              />
            </Field>
            <Field label="Fuel" htmlFor="fuelType" error={err("fuelType")}>
              <NativeSelect id="fuelType" {...register("fuelType")} {...aria("fuelType")}>
                <option value="">Choose…</option>
                {Object.entries(FUEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Transmission" htmlFor="transmission" error={err("transmission")}>
              <NativeSelect
                id="transmission"
                {...register("transmission")}
                {...aria("transmission")}
              >
                <option value="">Choose…</option>
                {Object.entries(TRANSMISSION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Owners" htmlFor="ownershipCount" error={err("ownershipCount")}>
              <Input
                id="ownershipCount"
                type="number"
                min={1}
                inputMode="numeric"
                {...register("ownershipCount")}
                {...aria("ownershipCount")}
              />
            </Field>
            <Field label="Condition" htmlFor="condition" error={err("condition")}>
              <NativeSelect id="condition" {...register("condition")}>
                {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Colour" htmlFor="colour" error={err("colour")} hint="Optional">
              <Input id="colour" {...register("colour")} />
            </Field>
            <Field
              label="Seats"
              htmlFor="seatingCapacity"
              error={err("seatingCapacity")}
              hint="Optional"
            >
              <Input
                id="seatingCapacity"
                type="number"
                inputMode="numeric"
                {...register("seatingCapacity")}
                {...aria("seatingCapacity")}
              />
            </Field>
          </div>

          <div className="space-y-3 border-t pt-5">
            <div>
              <h3 className="text-sm font-medium">Extra details</h3>
              <p className="text-xs text-muted-foreground">
                Features, service history or commercial details like payload and permit. Shown
                grouped on the vehicle page.
              </p>
            </div>
            {specs.fields.length > 0 && (
              <ul className="space-y-2">
                {specs.fields.map((spec, index) => (
                  <li
                    key={spec.id}
                    className="grid gap-2 sm:grid-cols-[8rem_10rem_1fr_auto] sm:items-start"
                  >
                    <div>
                      <Input
                        aria-label={`Group for detail ${index + 1}`}
                        placeholder="Group"
                        {...register(`specifications.${index}.group`)}
                        {...aria(`specifications.${index}.group`)}
                      />
                      {err(`specifications.${index}.group`) && (
                        <p className="mt-1 text-xs text-destructive">
                          {err(`specifications.${index}.group`)}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        aria-label={`Label for detail ${index + 1}`}
                        placeholder="Label, e.g. Payload"
                        {...register(`specifications.${index}.label`)}
                        {...aria(`specifications.${index}.label`)}
                      />
                      {err(`specifications.${index}.label`) && (
                        <p className="mt-1 text-xs text-destructive">
                          {err(`specifications.${index}.label`)}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        aria-label={`Value for detail ${index + 1}`}
                        placeholder="Value, e.g. 1,240 kg"
                        {...register(`specifications.${index}.value`)}
                        {...aria(`specifications.${index}.value`)}
                      />
                      {err(`specifications.${index}.value`) && (
                        <p className="mt-1 text-xs text-destructive">
                          {err(`specifications.${index}.value`)}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => specs.remove(index)}
                      aria-label={`Remove detail ${index + 1}`}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                specs.append({
                  group: specs.fields.at(-1)?.group ?? "Features",
                  label: "",
                  value: "",
                })
              }
              disabled={specs.fields.length >= 40}
            >
              <Plus data-icon="inline-start" aria-hidden /> Add detail
            </Button>
          </div>
        </Section>

        <Section
          title="Private details"
          description="Never shown on the website."
          icon={<Lock className="size-4 text-muted-foreground" aria-hidden />}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Registration number"
              htmlFor="registrationNumber"
              error={err("registrationNumber")}
            >
              <Input
                id="registrationNumber"
                placeholder="KL 07 AB 1234"
                className="uppercase"
                {...register("registrationNumber")}
                {...aria("registrationNumber")}
              />
            </Field>
          </div>
          <Field
            label="Internal notes"
            htmlFor="internalNotes"
            error={err("internalNotes")}
            hint="Purchase price, seller contact, pending work…"
          >
            <Textarea id="internalNotes" rows={4} {...register("internalNotes")} />
          </Field>
        </Section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <section className="rounded-lg border bg-surface">
          <header className="border-b px-5 py-4">
            <h2 className="font-semibold">Publishing</h2>
          </header>
          <div className="space-y-5 p-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Visibility</legend>
              <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
                {(["DRAFT", "PUBLISHED"] as const).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "cursor-pointer rounded-sm py-1.5 text-center text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                      status === value
                        ? "bg-surface text-ink shadow-sm"
                        : "text-muted-foreground hover:text-ink",
                    )}
                  >
                    <input type="radio" value={value} className="sr-only" {...register("status")} />
                    {value === "DRAFT" ? "Draft" : "Published"}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {status === "PUBLISHED"
                  ? "Visible on the website."
                  : "Only visible here in the admin."}
              </p>
            </fieldset>

            <Field label="Availability" htmlFor="availability">
              <NativeSelect id="availability" {...register("availability")}>
                {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="isFeatured" className="flex-col items-start gap-0.5">
                    <span>Feature on homepage</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Shown in “Hand-picked”
                    </span>
                  </Label>
                  <Switch
                    id="isFeatured"
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </div>
        </section>

        <section className="rounded-lg border bg-surface">
          <header className="border-b px-5 py-4">
            <h2 className="font-semibold">Pricing</h2>
          </header>
          <div className="space-y-5 p-5">
            <Field label="Selling price (₹)" htmlFor="price" error={err("price")}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={1000}
                  inputMode="numeric"
                  className="tabular pl-7"
                  {...register("price")}
                  {...aria("price")}
                />
              </div>
            </Field>
            <Controller
              control={control}
              name="showPrice"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="showPrice" className="flex-col items-start gap-0.5">
                    <span>Show price publicly</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Off shows “{CONTACT_FOR_PRICE}”
                    </span>
                  </Label>
                  <Switch
                    id="showPrice"
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      void form.trigger("price");
                    }}
                  />
                </div>
              )}
            />
            <div className="rounded-md bg-muted px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Customers will see</p>
              <p className="tabular font-display font-bold">
                {showPrice && priceNumber > 0 ? formatINR(priceNumber) : CONTACT_FOR_PRICE}
              </p>
            </div>
          </div>
        </section>

        {vehicle && (
          <section className="rounded-lg border bg-surface p-5">
            <Field
              label="Web address"
              htmlFor="slug"
              error={err("slug")}
              hint="Changing this breaks links people have already shared."
            >
              <div className="flex items-center rounded-md border border-input bg-surface focus-within:border-ring">
                <span className="pl-3 text-xs text-muted-foreground">/vehicles/</span>
                <input
                  id="slug"
                  className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
                  {...register("slug")}
                  {...aria("slug")}
                />
              </div>
            </Field>
            {vehicle.status === "PUBLISHED" && (
              <a
                href={`/vehicles/${vehicle.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
              >
                View on website <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </section>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" size="xl" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
            {isPending
              ? "Saving…"
              : vehicle
                ? "Save changes"
                : status === "PUBLISHED"
                  ? "Create and publish"
                  : "Create draft"}
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/admin/vehicles">Back to vehicles</Link>
          </Button>
          {isDirty && !isPending && (
            <p className="text-center text-xs text-amber-ink">You have unsaved changes</p>
          )}
        </div>
      </aside>
    </form>
  );
}
