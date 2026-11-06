"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTaxonomy, saveTaxonomy } from "@/actions/taxonomy";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TaxonomyRow } from "@/lib/data/admin";
import { slugify } from "@/lib/slug";
import {
  taxonomySchema,
  type TaxonomyInput,
  type TaxonomyKind,
  type TaxonomyValues,
} from "@/lib/validations/taxonomy";

const COPY = {
  category: { singular: "category", title: "Category", publicParam: "category" },
  brand: { singular: "brand", title: "Brand", publicParam: "brand" },
} as const;

function TaxonomyDialog({
  kind,
  row,
  open,
  onOpenChange,
  nextSortOrder,
}: {
  kind: TaxonomyKind;
  row: TaxonomyRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextSortOrder: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const copy = COPY[kind];
  const form = useForm<TaxonomyInput, unknown, TaxonomyValues>({
    resolver: zodResolver(taxonomySchema),
    values: {
      id: row?.id,
      name: row?.name ?? "",
      slug: row?.slug ?? "",
      description: row?.description ?? "",
      sortOrder: row?.sortOrder ?? nextSortOrder,
      isActive: row?.isActive ?? true,
    },
  });
  const { errors } = form.formState;
  const name = useWatch({ control: form.control, name: "name" });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveTaxonomy(kind, values);
      if (!result.ok) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(field as keyof TaxonomyInput, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      toast.success(row ? `${copy.title} updated` : `${copy.title} added`);
      onOpenChange(false);
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{row ? `Edit ${copy.singular}` : `Add ${copy.singular}`}</DialogTitle>
            <DialogDescription>
              {kind === "category"
                ? "Categories group vehicles on the website, e.g. SUVs or Mini Trucks."
                : "Brands appear in vehicle listings and catalogue filters."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="tax-name">Name</Label>
            <Input
              id="tax-name"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              {...form.register("name")}
            />
            {errors.name && (
              <p className="text-[0.8125rem] text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tax-slug">Web address</Label>
            <div className="flex items-center rounded-md border border-input focus-within:border-ring">
              <span className="pl-3 text-xs whitespace-nowrap text-muted-foreground">
                ?{copy.publicParam}=
              </span>
              <input
                id="tax-slug"
                placeholder={slugify(name ?? "") || "auto"}
                className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
                {...form.register("slug")}
              />
            </div>
            {errors.slug ? (
              <p className="text-[0.8125rem] text-destructive">{errors.slug.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Leave blank to generate from the name.
              </p>
            )}
          </div>

          {kind === "category" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="tax-description">Short description</Label>
                <Textarea
                  id="tax-description"
                  rows={2}
                  maxLength={200}
                  {...form.register("description")}
                />
                <p className="text-xs text-muted-foreground">
                  Shown on the homepage category tiles.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax-sort">Display order</Label>
                <Input
                  id="tax-sort"
                  type="number"
                  min={0}
                  className="w-28"
                  {...form.register("sortOrder")}
                />
              </div>
            </>
          )}

          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2.5">
                <Label htmlFor="tax-active" className="flex-col items-start gap-0.5">
                  <span>Visible on the website</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Hidden ones stay usable in the admin
                  </span>
                </Label>
                <Switch
                  id="tax-active"
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
              )}
              {row ? "Save changes" : `Add ${copy.singular}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Table + add/edit dialog + guarded delete for categories or brands. */
export function TaxonomyManager({ kind, rows }: { kind: TaxonomyKind; rows: TaxonomyRow[] }) {
  const router = useRouter();
  const copy = COPY[kind];
  const [editing, setEditing] = useState<TaxonomyRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<TaxonomyRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const nextSortOrder = rows.reduce((max, row) => Math.max(max, row.sortOrder + 1), 0);

  function openDialog(row: TaxonomyRow | null) {
    setEditing(row);
    setDialogOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteTaxonomy(kind, deleting.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="lg" onClick={() => openDialog(null)}>
          <Plus data-icon="inline-start" aria-hidden />
          Add {copy.singular}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Web address</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No {copy.singular === "category" ? "categories" : "brands"} yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <p className="font-medium">{row.name}</p>
                  {row.description && (
                    <p className="max-w-sm truncate text-xs text-muted-foreground">
                      {row.description}
                    </p>
                  )}
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                  {row.slug}
                </TableCell>
                <TableCell className="tabular font-mono">{row.vehicleCount}</TableCell>
                <TableCell>
                  {row.isActive ? (
                    <span className="text-sm">Visible</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Hidden</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(row)}
                      aria-label={`Edit ${row.name}`}
                    >
                      <Pencil aria-hidden />
                    </Button>
                    {row.vehicleCount > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="inline-flex">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled
                              aria-label={`Can't delete ${row.name}`}
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          In use by {row.vehicleCount} vehicle{row.vehicleCount === 1 ? "" : "s"}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(row)}
                        aria-label={`Delete ${row.name}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TaxonomyDialog
        kind={kind}
        row={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nextSortOrder={nextSortOrder}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? ""}?`}
        description={`This ${copy.singular} isn't used by any vehicle and will be removed permanently.`}
        confirmLabel={`Delete ${copy.singular}`}
        pending={isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
