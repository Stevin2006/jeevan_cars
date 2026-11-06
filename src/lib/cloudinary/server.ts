import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnv } from "@/lib/env";
import { ALLOWED_IMAGE_FORMATS, MAX_IMAGE_BYTES } from "@/lib/validations/vehicle";

const MIN_DIMENSION = 400;

export type UploadFolder = "vehicles" | "site";

function client() {
  const env = getCloudinaryEnv();
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return { cloudinary, env };
}

export function isCloudinaryConfigured(): boolean {
  try {
    getCloudinaryEnv();
    return true;
  } catch {
    return false;
  }
}

function folderPath(folder: UploadFolder) {
  return `${getCloudinaryEnv().CLOUDINARY_FOLDER}/${folder}`;
}

/**
 * Short-lived signature for a direct browser → Cloudinary upload. The signed
 * parameters pin the destination folder and allowed formats, so the browser
 * can't upload elsewhere or upload other file types with it.
 */
export function createUploadSignature(folder: UploadFolder) {
  const { cloudinary: cld, env } = client();
  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: folderPath(folder),
    allowed_formats: ALLOWED_IMAGE_FORMATS.join(","),
  };
  const signature = cld.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);
  return {
    ...params,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  };
}

export type VerifiedAsset = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
};

/**
 * Re-reads an uploaded asset from Cloudinary's Admin API and checks it is an
 * image in our folder, an allowed format, within size limits. URLs and sizes
 * come from Cloudinary, never from the browser. Invalid assets are deleted.
 */
export async function verifyUploadedAsset(
  publicId: string,
  folder: UploadFolder,
): Promise<VerifiedAsset | { error: string }> {
  const { cloudinary: cld } = client();
  if (!publicId.startsWith(`${folderPath(folder)}/`)) {
    return { error: "That photo wasn't uploaded through this site." };
  }

  let resource: {
    public_id: string;
    secure_url: string;
    format: string;
    bytes: number;
    width: number;
    height: number;
    resource_type: string;
  };
  try {
    resource = await cld.api.resource(publicId, { resource_type: "image" });
  } catch {
    return { error: "A photo couldn't be found on the image server. Please upload it again." };
  }

  const problem =
    resource.resource_type !== "image" ||
    !(ALLOWED_IMAGE_FORMATS as readonly string[]).includes(resource.format)
      ? "Photos must be JPG, PNG, WebP or AVIF."
      : resource.bytes > MAX_IMAGE_BYTES
        ? "Each photo must be 10 MB or smaller."
        : resource.width < MIN_DIMENSION || resource.height < MIN_DIMENSION
          ? `Photos must be at least ${MIN_DIMENSION}px on each side.`
          : null;

  if (problem) {
    await destroyAssets([publicId]);
    return { error: problem };
  }

  return {
    publicId: resource.public_id,
    url: resource.secure_url,
    width: resource.width,
    height: resource.height,
    bytes: resource.bytes,
  };
}

/** Best-effort deletion; failures are logged, never thrown. */
export async function destroyAssets(publicIds: string[]) {
  // Development sample images were never uploaded to Cloudinary.
  const ids = publicIds.filter((id) => !id.startsWith("sample/"));
  if (ids.length === 0 || !isCloudinaryConfigured()) return;
  try {
    await client().cloudinary.api.delete_resources(ids, { resource_type: "image" });
  } catch (error) {
    console.error("[cloudinary] failed to delete assets", ids, error);
  }
}
