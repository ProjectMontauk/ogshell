import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import RpcLogger from "../components/RpcLogger";
import { PortfolioProvider } from "../contexts/PortfolioContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import ConditionalFooter from "../../components/ConditionalFooter";
import { THEME_INIT_SCRIPT } from "../lib/theme";

// Source Serif for headlines, figures and reading text; IBM Plex Mono for the interface.
const serif = Source_Serif_4({
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});
const mono = IBM_Plex_Mono({
  variable: "--font-text",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Time Discovers Truth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-GDH6QS9TC1" strategy="afterInteractive" />
        <Script id="google-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GDH6QS9TC1');
          `}
        </Script>
      </head>
      <body className={`${serif.variable} ${mono.variable} overflow-x-hidden`}>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <PortfolioProvider>
          <ThemeProvider>
            <Providers>
              <RpcLogger />
              <main id="main" className="min-h-[100dvh]">
                {children}
              </main>
              <Suspense fallback={null}>
                <ConditionalFooter />
              </Suspense>
            </Providers>
          </ThemeProvider>
        </PortfolioProvider>
      </body>
    </html>
  );
}
