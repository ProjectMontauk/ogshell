"use client";

import { useTheme } from "../src/contexts/ThemeContext";

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 .75a8.25 8.25 0 00-8.25 8.25c0 3.154 1.77 5.896 4.375 7.284V19.5a.75.75 0 00.75.75h6.25a.75.75 0 00.75-.75v-3.216A8.237 8.237 0 0020.25 9a8.25 8.25 0 00-8.25-8.25zM9.75 21a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const { resolved, toggleTheme } = useTheme();
  const iconClass = "h-4 w-4 shrink-0 text-zinc-800 dark:text-white";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yes"
      aria-label={resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      suppressHydrationWarning
    >
      <span>Switch theme</span>
      {resolved === "dark" ? (
        <LightbulbIcon className={iconClass} />
      ) : (
        <MoonIcon className={iconClass} />
      )}
    </button>
  );
}
