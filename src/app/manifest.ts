import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jeevan Cars",
    short_name: "Jeevan Cars",
    description: "Quality pre-owned cars and commercial vehicles.",
    start_url: "/",
    display: "browser",
    background_color: "#f4f5f3",
    theme_color: "#0f1216",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
