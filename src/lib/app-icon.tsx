import type { CSSProperties } from "react";

export const APP_ICON_BG = "#FFFFFF";
export const APP_ICON_MARK = "#0A0A0A";
/** Browser theme bar — matches app accent */
export const APP_ICON_ACCENT = "#2563EB";

export function AppIconImage({ size }: { size: number }) {
  const radius = Math.round(size * 0.24);
  const mark = Math.round(size * 0.48);

  const container: CSSProperties = {
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: APP_ICON_BG,
    borderRadius: radius,
  };

  return (
    <div style={container}>
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 24 24"
        fill={APP_ICON_MARK}
        role="img"
        aria-label="Fun Mun"
      >
        <path d="M7 3h10a1.5 1.5 0 0 1 1.5 1.5V20l-6.5-3-6.5 3V4.5A1.5 1.5 0 0 1 7 3z" />
      </svg>
    </div>
  );
}
