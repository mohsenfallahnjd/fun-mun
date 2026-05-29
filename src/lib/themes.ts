export type ThemeId = "terracotta" | "ocean" | "forest" | "plum" | "rose" | "slate";

export interface ThemeOption {
  id: ThemeId;
  label: string;
  swatch: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

export const DEFAULT_THEME: ThemeId = "terracotta";

const LIGHT_STRUCTURE = {
  "--foreground": "#1c1713",
  "--surface": "#fffaf4",
  "--surface-raised": "#ffffff",
  "--muted": "#6e665e",
  "--border": "#ddd2c4",
  "--shadow": "rgb(28 23 19 / 0.06)",
} as const;

const DARK_STRUCTURE = {
  "--foreground": "#f3ebe2",
  "--surface": "#1c1916",
  "--surface-raised": "#252220",
  "--muted": "#a69d94",
  "--border": "#342f2a",
  "--shadow": "rgb(0 0 0 / 0.25)",
} as const;

function palette(mode: "light" | "dark", colors: Record<string, string>): Record<string, string> {
  const base = mode === "light" ? LIGHT_STRUCTURE : DARK_STRUCTURE;
  return { ...base, ...colors };
}

export const THEMES: ThemeOption[] = [
  {
    id: "terracotta",
    label: "Terracotta",
    swatch: "#b85c38",
    light: palette("light", {
      "--background": "#f3ece3",
      "--background-subtle": "#e8dfd3",
      "--accent": "#b85c38",
      "--accent-hover": "#9c4a2b",
      "--accent-soft": "rgb(184 92 56 / 0.12)",
      "--accent-foreground": "#fff9f4",
    }),
    dark: palette("dark", {
      "--background": "#12100e",
      "--background-subtle": "#1a1714",
      "--accent": "#d4845f",
      "--accent-hover": "#e09872",
      "--accent-soft": "rgb(212 132 95 / 0.16)",
      "--accent-foreground": "#1c1713",
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
