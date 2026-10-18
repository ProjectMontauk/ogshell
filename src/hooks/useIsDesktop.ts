"use client";

import { useEffect, useState } from "react";

/** True at md (768px) and above. False during SSR and on first client render. */
export function useIsDesktop(query = "(min-width: 768px)") {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
