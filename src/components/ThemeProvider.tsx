"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchProfile, patchProfile } from "@/lib/profile-client";
import {
  applyThemeToDocument,
  loadThemePreference,
  prefersDarkMode,
  saveThemePreference,
} from "@/lib/theme-storage";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "@/lib/themes";

const THEME_KEY = "fun-mun-theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const themeRef = useRef(theme);
  const cloudSyncedRef = useRef(false);

  themeRef.current = theme;

  const apply = useCallback((themeId: ThemeId) => {
    applyThemeToDocument(themeId, prefersDarkMode());
    setThemeState(themeId);
  }, []);

  const setTheme = useCallback(
    (themeId: ThemeId) => {
      apply(themeId);
      saveThemePreference(themeId);
      if (status === "authenticated") {
        patchProfile({ theme: themeId }).catch(() => {});
      }
    },
    [apply, status],
  );

  // Apply saved theme on mount + when system dark mode changes
  useEffect(() => {
    apply(loadThemePreference());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyThemeToDocument(themeRef.current, mq.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apply]);

  // Sync cloud theme once — local preference always wins
  useEffect(() => {
    if (status !== "authenticated" || cloudSyncedRef.current) return;

    fetchProfile()
      .then((profile) => {
        cloudSyncedRef.current = true;
        const local = localStorage.getItem(THEME_KEY);
        if (local && isThemeId(local)) {
          apply(local);
          return;
        }
        const cloudTheme = profile?.theme;
        if (cloudTheme && isThemeId(cloudTheme)) {
          apply(cloudTheme);
          saveThemePreference(cloudTheme);
        }
      })
      .catch(() => {
        cloudSyncedRef.current = true;
      });
  }, [status, apply]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
