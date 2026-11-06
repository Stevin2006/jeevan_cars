import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the "J" monogram with the amber indicator. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1216",
        color: "#f4f5f3",
        fontSize: 120,
        fontWeight: 800,
        position: "relative",
      }}
    >
      J
      <div
        style={{
          position: "absolute",
          right: 34,
          bottom: 40,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: "#f0a43a",
        }}
      />
    </div>,
    size,
  );
}
