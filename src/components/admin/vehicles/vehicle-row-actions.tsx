"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Send,
  Star,
  StarOff,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteVehicle, quickUpdateVehicle } from "@/actions/vehicles";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminVehicleRow } from "@/lib/data/admin";

type QuickChange = {
  availability?: AdminVehicleRow["availability"];
  status?: AdminVehicleRow["status"];
  isFeatured?: boolean;
};

export function VehicleRowActions({ vehicle }: { vehicle: AdminVehicleRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const title = `${vehicle.manufacturingYear} ${vehicle.name}`;

  function apply(changes: QuickChange, message: string) {
    startTransition(async () => {
      const result = await quickUpdateVehicle({ id: vehicle.id, ...changes });
      if (!result.ok) return void toast.error(result.error);
      toast.success(message);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteVehicle(vehicle.id);
      if (!result.ok) return void toast.error(result.error);
      setConfirmOpen(false);
      toast.success(`${title} deleted`);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${title}`}
            disabled={isPending}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={`/admin/vehicles/${vehicle.id}/edit`}>
              <Pencil aria-hidden /> Edit
            </Link>
          </DropdownMenuItem>
          {vehicle.status === "PUBLISHED" && (
            <DropdownMenuItem asChild>
              <a href={`/vehicles/${vehicle.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden /> View on website
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Mark as</DropdownMenuLabel>
          {vehicle.availability !== "AVAILABLE" && (
            <DropdownMenuItem
              onSelect={() => apply({ availability: "AVAILABLE" }, "Marked as available")}
            >
              <CheckCircle2 aria-hidden /> Available
            </DropdownMenuItem>
          )}
          {vehicle.availability !== "RESERVED" && (
            <DropdownMenuItem
              onSelect={() => apply({ availability: "RESERVED" }, "Marked as reserved")}
            >
              <Clock aria-hidden /> Reserved
            </DropdownMenuItem>
          )}
          {vehicle.availability !== "SOLD" && (
            <DropdownMenuItem onSelect={() => apply({ availability: "SOLD" }, "Marked as sold")}>
              <Tag aria-hidden /> Sold
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {vehicle.status === "DRAFT" ? (
            <DropdownMenuItem onSelect={() => apply({ status: "PUBLISHED" }, "Published")}>
              <Send aria-hidden /> Publish
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => apply({ status: "DRAFT" }, "Moved to drafts")}>
              <EyeOff aria-hidden /> Unpublish
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() =>
              apply(
                { isFeatured: !vehicle.isFeatured },
                vehicle.isFeatured ? "Removed from featured" : "Added to featured",
              )
            }
          >
            {vehicle.isFeatured ? <StarOff aria-hidden /> : <Star aria-hidden />}
            {vehicle.isFeatured ? "Remove from featured" : "Feature on homepage"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <Trash2 aria-hidden /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${title}?`}
        description={
          <>
            This permanently removes the listing and its {vehicle.imageCount} photo
            {vehicle.imageCount === 1 ? "" : "s"}.
            {vehicle.enquiryCount > 0 &&
              ` Its ${vehicle.enquiryCount} enquir${vehicle.enquiryCount === 1 ? "y is" : "ies are"} kept but unlinked.`}{" "}
            To hide it instead, unpublish it or mark it as sold.
          </>
        }
        confirmLabel="Delete vehicle"
        pending={isPending}
        onConfirm={remove}
      />
    </>
  );
}
