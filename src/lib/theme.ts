/** User-facing theme storage (partner iframe can override via `?embed=1&theme=dark|light` on first paint). */
export const THEME_STORAGE_KEY = "citizen-theme";

export type StoredTheme = "light" | "dark";

/** Runs before paint: localStorage → system → optional embed URL override. */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY
)};var s=localStorage.getItem(k);var dark;if(s==="dark")dark=true;else if(s==="light")dark=false;else dark=window.matchMedia("(prefers-color-scheme: dark)").matches;if(dark)document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");var q=location.search||"";if(q.indexOf("embed=1")!==-1){if(q.indexOf("theme=dark")!==-1)document.documentElement.classList.add("dark");else if(q.indexOf("theme=light")!==-1)document.documentElement.classList.remove("dark");}}catch(e){}})();`;
