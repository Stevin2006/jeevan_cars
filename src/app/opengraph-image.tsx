import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Jeevan Cars — quality pre-owned cars and commercial vehicles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share image for pages without their own (vehicle pages use the car photo). */
export default async function OpengraphImage() {
  const badge = await readFile(join(process.cwd(), "src/assets/brand/jeevan-cars-badge.png"));
  const badgeSrc = `data:image/png;base64,${badge.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 72,
        padding: "64px 80px",
        background: "radial-gradient(circle at 28% 50%, #2a1012 0%, #0f1216 55%)",
        color: "#f4f5f3",
      }}
    >
      <img src={badgeSrc} width={400} height={400} alt="" />
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>
            Driven before.
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1,
              color: "#ff3b42",
            }}
          >
            Ready for more.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#c9ccd1", letterSpacing: 3 }}>
          PRE-OWNED CARS · SUVS · COMMERCIAL VEHICLES
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#8b9097" }}>
          Thingalnagar, Kanyakumari · +91 94879 61066
        </div>
      </div>
    </div>,
    size,
  );
}
