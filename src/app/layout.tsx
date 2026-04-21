import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import RpcLogger from "../components/RpcLogger";
import { PortfolioProvider } from "../contexts/PortfolioContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import ConditionalFooter from "../../components/ConditionalFooter";
import { THEME_INIT_SCRIPT } from "../lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Time Discovers Truth",
  description: "A home for honest debate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden bg-background text-foreground`}
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <PortfolioProvider>
          <ThemeProvider>
            <Providers>
              <RpcLogger />
              <main className="min-h-screen bg-background text-foreground">
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
