"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/** Delegates resizing to Cloudinary (f_auto/q_auto) instead of the Next.js optimizer. */
export const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const match = CLOUDINARY_UPLOAD.exec(src);
  if (!match) return src;
  const [, base, rest] = match;
  return `${base}f_auto,q_${quality ?? "auto"},c_limit,w_${width}/${rest}`;
};

/**
 * next/image that serves Cloudinary assets straight from Cloudinary's CDN and
 * everything else through the built-in optimizer.
 */
export function SmartImage({ alt, ...props }: ImageProps) {
  const isCloudinary = typeof props.src === "string" && CLOUDINARY_UPLOAD.test(props.src);
  return <Image alt={alt} {...props} loader={isCloudinary ? cloudinaryLoader : undefined} />;
}
