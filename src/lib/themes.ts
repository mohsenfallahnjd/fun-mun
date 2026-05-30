import { APP_ICON_BG, APP_ICON_MARK } from "./app-icon";

export type ThemeId =
  | "terracotta"
  | "ink"
  | "white"
  | "ocean"
  | "forest"
  | "plum"
  | "rose"
  | "slate";

export interface ThemeOption {
  id: ThemeId;
  label: string;
  swatch: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

export const DEFAULT_THEME: ThemeId = "terracotta";

const LIGHT_STRUCTURE = {
  "--foreground": "#0f172a",
  "--surface": "#ffffff",
  "--surface-raised": "#ffffff",
  "--muted": "#64748b",
  "--border": "#e2e8f0",
  "--shadow": "rgb(15 23 42 / 0.06)",
} as const;

const DARK_STRUCTURE = {
  "--foreground": "#f8fafc",
  "--surface": "#18181b",
  "--surface-raised": "#27272a",
  "--muted": "#94a3b8",
  "--border": "#334155",
  "--shadow": "rgb(0 0 0 / 0.25)",
} as const;

function palette(mode: "light" | "dark", colors: Record<string, string>): Record<string, string> {
  const base = mode === "light" ? LIGHT_STRUCTURE : DARK_STRUCTURE;
  return { ...base, ...colors };
}

export const THEMES: ThemeOption[] = [
  {
    id: "terracotta",
    label: "Blue",
    swatch: "#2563eb",
    light: palette("light", {
      "--background": "#f8fafc",
      "--background-subtle": "#f1f5f9",
      "--accent": "#2563eb",
      "--accent-hover": "#1d4ed8",
      "--accent-soft": "rgb(37 99 235 / 0.1)",
      "--accent-foreground": "#ffffff",
    }),
    dark: palette("dark", {
      "--background": "#09090b",
      "--background-subtle": "#18181b",
      "--accent": "#60a5fa",
      "--accent-hover": "#93c5fd",
      "--accent-soft": "rgb(96 165 250 / 0.14)",
      "--accent-foreground": "#0f172a",
    }),
  },
  {
    id: "ink",
    label: "Ink",
    swatch: APP_ICON_MARK,
    light: palette("light", {
      "--background": APP_ICON_BG,
      "--background-subtle": "#f5f5f5",
      "--foreground": APP_ICON_MARK,
      "--surface": APP_ICON_BG,
      "--border": "#e5e5e5",
      "--muted": "#737373",
      "--shadow": "rgb(10 10 10 / 0.06)",
      "--accent": APP_ICON_MARK,
      "--accent-hover": "#262626",
      "--accent-soft": "rgb(10 10 10 / 0.08)",
      "--accent-foreground": APP_ICON_BG,
    }),
    dark: palette("dark", {
      "--background": APP_ICON_MARK,
      "--background-subtle": "#141414",
      "--foreground": "#fafafa",
      "--surface": "#141414",
      "--surface-raised": "#1f1f1f",
      "--border": "#262626",
      "--muted": "#a3a3a3",
      "--shadow": "rgb(0 0 0 / 0.25)",
      "--accent": "#fafafa",
      "--accent-hover": "#e5e5e5",
      "--accent-soft": "rgb(250 250 250 / 0.08)",
      "--accent-foreground": APP_ICON_MARK,
    }),
  },
  {
    id: "white",
    label: "White",
    swatch: APP_ICON_BG,
    light: palette("light", {
      "--background": APP_ICON_BG,
      "--background-subtle": APP_ICON_BG,
      "--foreground": "#262626",
      "--surface": APP_ICON_BG,
      "--surface-raised": APP_ICON_BG,
      "--border": "#ebebeb",
      "--muted": "#a3a3a3",
      "--shadow": "rgb(10 10 10 / 0.04)",
      "--accent": "#525252",
      "--accent-hover": "#404040",
      "--accent-soft": "rgb(82 82 82 / 0.06)",
      "--accent-foreground": APP_ICON_BG,
    }),
    dark: palette("dark", {
      "--background": "#262626",
      "--background-subtle": "#2e2e2e",
      "--foreground": APP_ICON_BG,
      "--surface": "#2e2e2e",
      "--surface-raised": "#363636",
      "--border": "#404040",
      "--muted": "#a3a3a3",
      "--shadow": "rgb(0 0 0 / 0.2)",
      "--accent": APP_ICON_BG,
      "--accent-hover": "#f5f5f5",
      "--accent-soft": "rgb(255 255 255 / 0.08)",
      "--accent-foreground": "#262626",
    }),
  },
  {
    id: "ocean",
    label: "Ocean",
    swatch: "#2f6b8a",
    light: palette("light", {
      "--background": "#edf3f7",
      "--background-subtle": "#dfeaf1",
      "--surface": "#f5fbff",
      "--surface-raised": "#ffffff",
      "--border": "#c8d9e4",
      "--muted": "#5a6f7d",
      "--accent": "#2f6b8a",
      "--accent-hover": "#25566f",
      "--accent-soft": "rgb(47 107 138 / 0.12)",
      "--accent-foreground": "#f5fbff",
    }),
    dark: palette("dark", {
      "--background": "#0e1216",
      "--background-subtle": "#141a21",
      "--surface": "#141a21",
      "--surface-raised": "#1c2430",
      "--border": "#243040",
      "--muted": "#8fa3b3",
      "--accent": "#6ba3c4",
      "--accent-hover": "#7fb5d4",
      "--accent-soft": "rgb(107 163 196 / 0.16)",
      "--accent-foreground": "#0e1216",
    }),
  },
  {
    id: "forest",
    label: "Forest",
    swatch: "#3d6b45",
    light: palette("light", {
      "--background": "#eef4ef",
      "--background-subtle": "#e0ebe2",
      "--surface": "#f4fff6",
      "--border": "#c5d9c8",
      "--muted": "#5a6f5e",
      "--accent": "#3d6b45",
      "--accent-hover": "#2f5536",
      "--accent-soft": "rgb(61 107 69 / 0.12)",
      "--accent-foreground": "#f4fff6",
    }),
    dark: palette("dark", {
      "--background": "#0e1210",
      "--background-subtle": "#141a16",
      "--surface": "#141a16",
      "--surface-raised": "#1a221c",
      "--border": "#243028",
      "--muted": "#8fa894",
      "--accent": "#7cb883",
      "--accent-hover": "#8ec995",
      "--accent-soft": "rgb(124 184 131 / 0.16)",
      "--accent-foreground": "#0e1210",
    }),
  },
  {
    id: "plum",
    label: "Plum",
    swatch: "#6b4f8a",
    light: palette("light", {
      "--background": "#f2eef6",
      "--background-subtle": "#e8e0f0",
      "--surface": "#faf5ff",
      "--border": "#d4c8e0",
      "--muted": "#6e5f7d",
      "--accent": "#6b4f8a",
      "--accent-hover": "#563f70",
      "--accent-soft": "rgb(107 79 138 / 0.12)",
      "--accent-foreground": "#faf5ff",
    }),
    dark: palette("dark", {
      "--background": "#110f14",
      "--background-subtle": "#18141f",
      "--surface": "#18141f",
      "--surface-raised": "#201c28",
      "--border": "#2c2438",
      "--muted": "#a89db8",
      "--accent": "#b89fd4",
      "--accent-hover": "#c8b0e0",
      "--accent-soft": "rgb(184 159 212 / 0.16)",
      "--accent-foreground": "#110f14",
    }),
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "#9e3d52",
    light: palette("light", {
      "--background": "#f7eef0",
      "--background-subtle": "#f0e0e4",
      "--surface": "#fff5f7",
      "--border": "#e0c5cc",
      "--muted": "#7d5a62",
      "--accent": "#9e3d52",
      "--accent-hover": "#853042",
      "--accent-soft": "rgb(158 61 82 / 0.12)",
      "--accent-foreground": "#fff5f7",
    }),
    dark: palette("dark", {
      "--background": "#140e10",
      "--background-subtle": "#1c1417",
      "--surface": "#1c1417",
      "--surface-raised": "#241a1d",
      "--border": "#342428",
      "--muted": "#b8949c",
      "--accent": "#e07a8a",
      "--accent-hover": "#e8909d",
      "--accent-soft": "rgb(224 122 138 / 0.16)",
      "--accent-foreground": "#140e10",
    }),
  },
  {
    id: "slate",
    label: "Slate",
    swatch: "#4a5568",
    light: palette("light", {
      "--background": "#f0f2f5",
      "--background-subtle": "#e4e8ed",
      "--surface": "#f8fafc",
      "--border": "#cbd2dc",
      "--muted": "#5a6578",
      "--accent": "#4a5568",
      "--accent-hover": "#3a4352",
      "--accent-soft": "rgb(74 85 104 / 0.12)",
      "--accent-foreground": "#f8fafc",
    }),
    dark: palette("dark", {
      "--background": "#0f1114",
      "--background-subtle": "#161a1f",
      "--surface": "#161a1f",
      "--surface-raised": "#1e232b",
      "--border": "#2a3140",
      "--muted": "#94a3b8",
      "--accent": "#94a3b8",
      "--accent-hover": "#a8b4c6",
      "--accent-soft": "rgb(148 163 184 / 0.16)",
      "--accent-foreground": "#0f1114",
    }),
  },
];

export function getTheme(id: ThemeId): ThemeOption {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function getThemeCssVars(themeId: ThemeId, isDark: boolean): Record<string, string> {
  const theme = getTheme(themeId);
  return isDark ? theme.dark : theme.light;
}
