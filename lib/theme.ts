"use client";

import { useCallback, useEffect, useState } from "react";

// Accent themes. Overriding --color-trail / --color-trail-soft reskins the
// whole app (buttons, highlights, charts) since everything keys off them.

export interface Theme {
  id: string;
  name: string;
  trail: string;
  trailSoft: string;
}

export const THEMES: Theme[] = [
  { id: "cyan", name: "Contrail", trail: "#34d0db", trailSoft: "#6fe0e8" },
  { id: "sky", name: "Sky", trail: "#5b8cf5", trailSoft: "#88abff" },
  { id: "violet", name: "Violet", trail: "#9b7bff", trailSoft: "#b9a3ff" },
  { id: "gold", name: "Gold", trail: "#e9b864", trailSoft: "#f3d18f" },
  { id: "rose", name: "Rose", trail: "#e8718f", trailSoft: "#f094a8" },
  { id: "mint", name: "Mint", trail: "#57cfa4", trailSoft: "#7fdcbb" },
  { id: "coral", name: "Coral", trail: "#ff7a59", trailSoft: "#ff9e85" },
  { id: "ice", name: "Ice", trail: "#7fd0ff", trailSoft: "#a9e0ff" },
];

export const DEFAULT_THEME = "cyan";
const KEY = "contrail.theme";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Apply an accent theme to a root element (defaults to <html>). */
export function applyAccent(id: string, root?: HTMLElement) {
  if (typeof document === "undefined") return;
  const el = root ?? document.documentElement;
  const t = getTheme(id);
  el.style.setProperty("--color-trail", t.trail);
  el.style.setProperty("--color-trail-soft", t.trailSoft);
}

export function clearAccent(root?: HTMLElement) {
  if (typeof document === "undefined") return;
  const el = root ?? document.documentElement;
  el.style.removeProperty("--color-trail");
  el.style.removeProperty("--color-trail-soft");
}

/** App-wide theme (the visitor's own preference), persisted in localStorage. */
export function useTheme() {
  const [theme, setThemeState] = useState<string>(DEFAULT_THEME);

  useEffect(() => {
    let id = DEFAULT_THEME;
    try {
      id = localStorage.getItem(KEY) || DEFAULT_THEME;
    } catch {
      /* ignore */
    }
    setThemeState(id);
    applyAccent(id);
  }, []);

  const setTheme = useCallback((id: string) => {
    setThemeState(id);
    applyAccent(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  return { theme, setTheme };
}
