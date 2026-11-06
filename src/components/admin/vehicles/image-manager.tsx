"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getVehicleUploadSignature } from "@/actions/vehicles";
import { uploadToCloudinary } from "@/lib/cloudinary/upload-client";
import { SmartImage } from "@/components/media/smart-image";
import { cn } from "@/lib/utils";
import { MAX_IMAGE_BYTES, MAX_IMAGES, type VehicleImageInput } from "@/lib/validations/vehicle";

import { ACCEPTED_IMAGE_TYPES as ACCEPTED_TYPES } from "@/lib/cloudinary/upload-client";
const CONCURRENCY = 3;

export type ManagedImage = Omit<VehicleImageInput, "altText"> & { altText?: string };

type Upload = { id: string; name: string; progress: number };

function SortableTile({
  image,
  index,
  count,
  onMove,
  onCover,
  onRemove,
  onAlt,
}: {
  image: ManagedImage;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onCover: () => void;
  onRemove: () => void;
  onAlt: (value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.publicId,
  });
  const iconButton =
    "flex size-7 items-center justify-center rounded-sm bg-surface/90 text-ink shadow-sm backdrop-blur hover:bg-surface disabled:opacity-40";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("space-y-1.5", isDragging && "z-10 opacity-80")}
    >
      <div
        className={cn(
          "group relative aspect-[3/2] overflow-hidden rounded-md bg-muted ring-offset-2",
          image.isPrimary && "ring-2 ring-amber",
        )}
      >
        <SmartImage
          src={image.url}
          alt={image.altText ?? ""}
          fill
          sizes="200px"
          quality={60}
          className="object-cover"
        />
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder photo ${index + 1}`}
          className="absolute top-1.5 left-1.5 flex size-7 cursor-grab items-center justify-center rounded-sm bg-surface/90 text-ink shadow-sm active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        {image.isPrimary ? (
          <span className="absolute top-1.5 right-1.5 rounded-sm bg-amber px-1.5 py-0.5 text-[0.6875rem] font-semibold text-ink">
            Cover
          </span>
        ) : (
          <button
            type="button"
            onClick={onCover}
            className={cn(iconButton, "absolute top-1.5 right-1.5")}
            aria-label={`Use photo ${index + 1} as cover`}
          >
            <Star className="size-3.5" aria-hidden />
          </button>
        )}
        <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
          <div className="flex gap-1">
            <button
              type="button"
              className={iconButton}
              disabled={index === 0}
              onClick={() => onMove(index, index - 1)}
              aria-label={`Move photo ${index + 1} earlier`}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={index === count - 1}
              onClick={() => onMove(index, index + 1)}
              aria-label={`Move photo ${index + 1} later`}
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
          <button
            type="button"
            className={cn(iconButton, "text-destructive")}
            onClick={onRemove}
            aria-label={`Remove photo ${index + 1}`}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
      <input
        type="text"
        value={image.altText ?? ""}
        onChange={(event) => onAlt(event.target.value)}
        maxLength={160}
        placeholder="Describe photo (optional)"
        aria-label={`Description for photo ${index + 1}`}
        className="h-8 w-full rounded-sm border border-input bg-surface px-2 text-xs outline-none focus-visible:border-ring"
      />
    </li>
  );
}

/**
 * Photo manager for the vehicle form. Uploads go straight to Cloudinary; the
 * server re-verifies every new photo when the form is saved.
 */
export function ImageManager({
  value,
  onChange,
  error,
}: {
  value: ManagedImage[];
  onChange: (images: ManagedImage[]) => void;
  error?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  // Uploads finish out of order; keep the latest list in a ref so none are lost.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function commit(images: ManagedImage[]) {
    // Guarantee exactly one cover whenever there are photos.
    const hasCover = images.some((image) => image.isPrimary);
    const next = images.map((image, index) => ({
      ...image,
      isPrimary: hasCover ? image.isPrimary : index === 0,
    }));
    latest.current = next;
    onChange(next);
  }

  function move(from: number, to: number) {
    commit(arrayMove(value, from, to));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = value.findIndex((image) => image.publicId === active.id);
    const to = value.findIndex((image) => image.publicId === over.id);
    if (from >= 0 && to >= 0) move(from, to);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const room = MAX_IMAGES - value.length - uploads.length;
    const files = Array.from(fileList).slice(0, Math.max(0, room));
    if (fileList.length > files.length)
      toast.warning(`Only ${MAX_IMAGES} photos are allowed per vehicle.`);

    const accepted = files.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: use JPG, PNG, WebP or AVIF.`);
        return false;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name} is larger than 10 MB.`);
        return false;
      }
      return true;
    });
    if (accepted.length === 0) return;

    const signature = await getVehicleUploadSignature();
    if (!signature.ok) return void toast.error(signature.error);

    const queue = accepted.map((file) => ({ file, id: `${file.name}-${crypto.randomUUID()}` }));
    setUploads((current) => [
      ...current,
      ...queue.map(({ id, file }) => ({ id, name: file.name, progress: 0 })),
    ]);

    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const { file, id } = item;
        try {
          const uploaded = await uploadToCloudinary(file, signature.data, (progress) =>
            setUploads((current) => current.map((u) => (u.id === id ? { ...u, progress } : u))),
          );
          commit([...latest.current, { ...uploaded, isPrimary: false }]);
        } catch (uploadError) {
          toast.error(
            `${file.name}: ${uploadError instanceof Error ? uploadError.message : "upload failed"}`,
          );
        } finally {
          setUploads((current) => current.filter((u) => u.id !== id));
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={value.map((image) => image.publicId)}
          strategy={rectSortingStrategy}
        >
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {value.map((image, index) => (
              <SortableTile
                key={image.publicId}
                image={image}
                index={index}
                count={value.length}
                onMove={move}
                onCover={() =>
                  commit(value.map((item, i) => ({ ...item, isPrimary: i === index })))
                }
                onRemove={() => commit(value.filter((_, i) => i !== index))}
                onAlt={(altText) =>
                  commit(value.map((item, i) => (i === index ? { ...item, altText } : item)))
                }
              />
            ))}
            <AnimatePresence>
              {uploads.map((upload) => (
                <motion.li
                  key={upload.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex aspect-[3/2] flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/50 p-3 text-center"
                >
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                  <span className="w-full truncate text-xs text-muted-foreground">
                    {upload.name}
                  </span>
                  <span
                    className="h-1 w-full overflow-hidden rounded-full bg-line"
                    role="progressbar"
                    aria-valuenow={upload.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${upload.name}`}
                  >
                    <span
                      className="block h-full bg-ink transition-[width]"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
            {value.length + uploads.length < MAX_IMAGES && (
              <li>
                <label
                  htmlFor={inputId}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    void handleFiles(event.dataTransfer.files);
                  }}
                  className="flex aspect-[3/2] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-ink/25 bg-surface text-center text-sm text-muted-foreground transition-colors hover:border-ink/50 hover:text-ink"
                >
                  <ImagePlus className="size-5" aria-hidden />
                  <span className="font-medium">Add photos</span>
                  <span className="text-xs">Drop or click · max 10 MB</span>
                </label>
                <input
                  ref={inputRef}
                  id={inputId}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    void handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
      <p className="text-xs text-muted-foreground">
        Drag or use the arrows to reorder. The <strong className="font-medium">cover</strong> photo
        appears on listings and when shared. {value.length}/{MAX_IMAGES} photos.
      </p>
      {error && (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
