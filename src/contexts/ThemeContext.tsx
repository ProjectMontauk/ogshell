"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { THEME_STORAGE_KEY, type StoredTheme } from "../lib/theme";

type ThemeContextValue = {
  resolved: "light" | "dark";
  setTheme: (t: StoredTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribe(onChange: () => void) {
  const m = new MutationObserver(onChange);
  m.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => m.disconnect();
}

function getResolvedSnapshot(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const resolved = useSyncExternalStore(
    subscribe,
    getResolvedSnapshot,
    () => "light"
  );

  const setTheme = useCallback((t: StoredTheme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    const next: StoredTheme = getResolvedSnapshot() === "dark" ? "light" : "dark";
    setTheme(next);
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ resolved, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
