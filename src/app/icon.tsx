import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#22c55e",
        borderRadius: 8,
      }}
    >
      <svg
        width="20"
        height="15"
        viewBox="0 0 32 24"
        fill="none"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>Troop</title>
        <polyline points="2 19 7 12 2 5" strokeOpacity={0.35} />
        <polyline points="11 19 16 12 11 5" strokeOpacity={0.65} />
        <polyline points="20 19 25 12 20 5" />
      </svg>
    </div>,
    { ...size },
  );
}
