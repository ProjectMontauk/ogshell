"use client";

import React from "react";
import ThemeToggle from "./ThemeToggle";

const Footer = () => (
  <footer className="w-full bg-background border-t-2 border-border shadow flex flex-col justify-center text-foreground">
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="py-0.5 px-1 text-xs font-semibold text-foreground" style={{ minWidth: 0 }}>
          Contact:
        </div>
        <div className="py-0.5 px-1 text-xs font-semibold text-foreground" style={{ minWidth: 0 }}>
          info@thecitizen.io
        </div>
      </div>
      <ThemeToggle />
    </div>
  </footer>
);

export default Footer;
