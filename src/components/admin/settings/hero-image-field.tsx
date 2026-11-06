"use client";

import { useId, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getSiteUploadSignature } from "@/actions/settings";
import { SmartImage } from "@/components/media/smart-image";
import { Button } from "@/components/ui/button";
import { ACCEPTED_IMAGE_TYPES, uploadToCloudinary } from "@/lib/cloudinary/upload-client";
import { MAX_IMAGE_BYTES } from "@/lib/validations/vehicle";

type Hero = { publicId: string; url: string } | null;

/** Single wide image upload for the homepage hero. */
export function HeroImageField({
  value,
  onChange,
  error,
}: {
  value: Hero;
  onChange: (value: Hero) => void;
  error?: string;
}) {
  const inputId = useId();
  const [progress, setProgress] = useState<number | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
      return void toast.error("Use a JPG, PNG, WebP or AVIF image.");
    if (file.size > MAX_IMAGE_BYTES) return void toast.error("The image must be 10 MB or smaller.");

    const signature = await getSiteUploadSignature();
    if (!signature.ok) return void toast.error(signature.error);
    setProgress(0);
    try {
      const uploaded = await uploadToCloudinary(file, signature.data, setProgress);
      onChange({ publicId: uploaded.publicId, url: uploaded.url });
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[21/9] overflow-hidden rounded-md border bg-ink">
        {value ? (
          <SmartImage
            src={value.url}
            alt="Homepage hero preview"
            fill
            sizes="640px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-6 text-center text-sm text-paper/60">
            No hero image — the homepage uses the lead featured vehicle&rsquo;s photo.
          </div>
        )}
        {progress !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/70 text-paper">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            <span className="tabular text-sm" role="status">
              Uploading {progress}%
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" disabled={progress !== null}>
          <label htmlFor={inputId} className="cursor-pointer">
            <ImagePlus data-icon="inline-start" aria-hidden />
            {value ? "Replace image" : "Upload image"}
          </label>
        </Button>
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(null)}
            disabled={progress !== null}
          >
            <Trash2 data-icon="inline-start" aria-hidden /> Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Wide landscape photo, at least 2400px across. Text sits on the left, so keep the subject to
        the right.
      </p>
      {error && <p className="text-[0.8125rem] text-destructive">{error}</p>}
    </div>
  );
}
