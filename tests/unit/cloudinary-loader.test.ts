import { describe, expect, it } from "vitest";
import { cloudinaryLoader } from "@/components/media/smart-image";

describe("cloudinaryLoader", () => {
  const src =
    "https://res.cloudinary.com/jeevan/image/upload/v1712345678/jeevan-cars/vehicles/abc.jpg";

  it("inserts format, quality and width transformations", () => {
    expect(cloudinaryLoader({ src, width: 828 })).toBe(
      "https://res.cloudinary.com/jeevan/image/upload/f_auto,q_auto,c_limit,w_828/v1712345678/jeevan-cars/vehicles/abc.jpg",
    );
    expect(cloudinaryLoader({ src, width: 384, quality: 60 })).toContain(
      "/f_auto,q_60,c_limit,w_384/",
    );
  });

  it("leaves non-Cloudinary URLs untouched", () => {
    expect(cloudinaryLoader({ src: "https://images.example/x.jpg", width: 640 })).toBe(
      "https://images.example/x.jpg",
    );
  });
});
