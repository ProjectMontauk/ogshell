"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "../src/contexts/ThemeContext";

/**
 * Both icons are rendered and the `.dark` class on <html> (set before hydration by the theme
 * script) picks one. Branching on the resolved theme in JS made the server and client render
 * different markup, which failed hydration and repainted the footer on every load.
 */
export default function ThemeToggle() {
  const { toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme} className="btn btn-ghost btn-sm gap-1.5 text-small">
      <span>Switch theme</span>
      <Moon size={15} aria-hidden className="dark:hidden" />
      <Sun size={15} aria-hidden className="hidden dark:block" />
    </button>
  );
}
