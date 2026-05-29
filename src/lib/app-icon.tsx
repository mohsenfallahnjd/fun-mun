import type { CSSProperties } from "react";

const ACCENT = "#b85c38";
const ACCENT_DARK = "#8f4528";

export function AppIconImage({ size }: { size: number }) {
  const radius = Math.round(size * 0.24);
  const iconSize = Math.round(size * 0.46);

  const container: CSSProperties = {
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(145deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
    borderRadius: radius,
  };

  return (
    <div style={container}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="white"
        role="img"
        aria-label="Fun Mun"
      >
        <path d="M6 2a2 2 0 0 0-2 2v18l8-4.5 8 4.5V4a2 2 0 0 0-2-2H6z" />
      </svg>
    </div>
  );
}
