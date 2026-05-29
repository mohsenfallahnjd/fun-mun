import { DEFAULT_THEME, getThemeCssVars, isThemeId, type ThemeId } from "./themes";

const PROFILE_KEY = "fun-mun-local-profile";
const THEME_KEY = "fun-mun-theme";

export interface LocalProfile {
  name?: string;
  theme?: ThemeId;
}

export function loadLocalProfile(): LocalProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return {};
  }
}

export function saveLocalProfile(profile: LocalProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadThemePreference(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_KEY);
  if (stored && isThemeId(stored)) return stored;
  const fromProfile = loadLocalProfile().theme;
  if (fromProfile && isThemeId(fromProfile)) return fromProfile;
  return DEFAULT_THEME;
}

export function saveThemePreference(theme: ThemeId): void {
  localStorage.setItem(THEME_KEY, theme);
  saveLocalProfile({ ...loadLocalProfile(), theme });
}

export function applyThemeToDocument(themeId: ThemeId, isDark: boolean): void {
  const palette = getThemeCssVars(themeId, isDark);
  const root = document.documentElement;

  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(key, value);
  }
  root.dataset.theme = themeId;
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function prefersDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
