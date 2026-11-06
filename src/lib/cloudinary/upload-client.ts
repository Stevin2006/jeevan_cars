/** Image types the browser may upload (mirrors the server's allowed formats). */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type UploadedImage = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
};

export type UploadSignature = {
  timestamp: number;
  folder: string;
  allowed_formats: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

/** Direct browser → Cloudinary upload with progress, using a server-issued signature. */
export function uploadToCloudinary(
  file: File,
  sig: UploadSignature,
  onProgress: (pct: number) => void,
) {
  return new Promise<UploadedImage>((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", sig.apiKey);
    body.append("timestamp", String(sig.timestamp));
    body.append("signature", sig.signature);
    body.append("folder", sig.folder);
    body.append("allowed_formats", sig.allowed_formats);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            publicId: data.public_id,
            url: data.secure_url,
            width: data.width,
            height: data.height,
            bytes: data.bytes,
          });
        } else {
          reject(new Error(data?.error?.message ?? "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(body);
  });
}
