"use client";

import React from "react";
import ThemeToggle from "./ThemeToggle";

const Footer = () => (
  <footer className="w-full bg-ground">
    <div className="container-page">
      <div className="rule-double flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between md:py-10">
      <div className="flex flex-col gap-0.5 text-small">
        <span className="text-muted">Contact:</span>
        <span className="text-ink-2">info@thecitizen.io</span>
      </div>
      <ThemeToggle />
      </div>
    </div>
  </footer>
);

export default Footer;
