import { ImageResponse } from "next/og";

export const alt = "Jeevan Cars — quality pre-owned cars and commercial vehicles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share image for pages without their own (vehicle pages use the car photo). */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#0f1216",
        color: "#f4f5f3",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        JEEVAN
        <div style={{ width: 14, height: 14, borderRadius: 7, background: "#f0a43a" }} />
        <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: 6, opacity: 0.7 }}>CARS</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>
          Driven before.
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1,
            color: "#8b9097",
          }}
        >
          Ready for more.
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#f0a43a", letterSpacing: 4 }}>
        PRE-OWNED CARS · SUVS · COMMERCIAL VEHICLES
      </div>
    </div>,
    size,
  );
}
