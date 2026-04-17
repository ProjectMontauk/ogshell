"use client";

import { useSearchParams } from "next/navigation";
import Footer from "./Footer";

/** Omits global footer in partner iframe mode (?embed=1). */
export default function ConditionalFooter() {
  const searchParams = useSearchParams();
  if (searchParams.get("embed") === "1") return null;
  return <Footer />;
}
