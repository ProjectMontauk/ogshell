"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { List, X } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { tokenContract } from "../constants/contracts";
import { CASH_TOKEN_SCALE } from "../constants/tokenUnits";
import { usePortfolio } from "../src/contexts/PortfolioContext";
import { getTotalBetValueUsd } from "../src/utils/portfolioTotals";


// Loaded after first paint: the wallet picker would otherwise ship with every page.
const WalletButton = dynamic(() => import("./WalletButton"), {
  ssr: false,
  loading: () => <span aria-hidden className="skeleton inline-block h-full w-[80px]" />,
});

/** The same sign-in the masthead uses, for pages that ask for it in their own content. */
export function SignInButton() {
  return <WalletButton large />;
}

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/market-ideas", label: "New" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/deposit", label: "Deposit" },
  { href: "/docs", label: "Docs" },
];

function formatBalance(balance: bigint | undefined): string {
  if (!balance) return "0";
  const amount = Number(balance) / CASH_TOKEN_SCALE;
  return amount % 1 === 0
    ? amount.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type NavbarVariant = "full" | "embed";

type NavbarProps = {
  /** `embed`: partner iframe (?embed=1). Balance and wallet only. */
  variant?: NavbarVariant;
};



const Navbar = ({ variant = "full" }: NavbarProps) => {
  const pathname = usePathname();
  const isEmbed = variant === "embed";
  const reduce = useReducedMotion();
  const account = useActiveAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  // The masthead's date line, set after mount so the server render and the first client render agree.
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  }, []);

  const { portfolioValue, setPortfolioValue, cashRefreshNonce, lastPortfolioHydrateKey, setLastPortfolioHydrateKey } = usePortfolio();
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const { data: balance, isPending, refetch } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: [account?.address ?? "0x0000000000000000000000000000000000000000"],
  });

  // Portfolio figure: cash + mark-to-market shares, deduped by wallet + refresh nonce.
  useEffect(() => {
    const addr = account?.address;
    if (!addr) {
      setPortfolioValue("--");
      setPortfolioLoading(false);
      setLastPortfolioHydrateKey(null);
      return;
    }
    const hydrateKey = `${addr}::${cashRefreshNonce}`;
    if (lastPortfolioHydrateKey === hydrateKey) {
      void refetch();
      setPortfolioLoading(false);
      return;
    }
    let cancelled = false;
    setPortfolioLoading(true);
    void (async () => {
      try {
        const refResult = await refetch();
        if (cancelled) return;
        const data = refResult.data as bigint | undefined;
        const cashUsd = data !== undefined ? Number(data) / CASH_TOKEN_SCALE : 0;
        let betUsd = 0;
        try {
          betUsd = await getTotalBetValueUsd(addr as `0x${string}`);
        } catch (e) {
          console.error("[Navbar] bet value totals failed:", e);
        }
        if (cancelled) return;
        setPortfolioValue((cashUsd + betUsd).toFixed(2));
        setLastPortfolioHydrateKey(hydrateKey);
      } catch (e) {
        console.error("[Navbar] portfolio total hydrate failed:", e);
        if (!cancelled) setPortfolioValue("--");
      } finally {
        if (!cancelled) setPortfolioLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account?.address, cashRefreshNonce, refetch, setPortfolioValue, setLastPortfolioHydrateKey, lastPortfolioHydrateKey]);

  // Close the menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const cashDisplay = !account?.address || isPending ? "--" : formatBalance(balance);
  const portfolioDisplay =
    portfolioLoading || portfolioValue === "--" ? "--" : Number(portfolioValue).toLocaleString(undefined, { maximumFractionDigits: 2 });

  // As on main: both figures always show ("$--" when signed out); Cash links to /deposit in the embed.
  const balanceLinks = (cashHref: string, className: string) => (
    <div className={`items-baseline gap-4 text-small ${className}`}>
      <Link href="/portfolio" className="text-muted transition-colors hover:text-ink">
        Portfolio <span className="num text-ink">${portfolioDisplay}</span>
      </Link>
      <Link href={cashHref} className="text-muted transition-colors hover:text-ink">
        Cash <span className="num text-ink">${cashDisplay}</span>
      </Link>
    </div>
  );
  const balances = balanceLinks("/portfolio", "flex");

  const connect = <WalletButton />;

  if (isEmbed) {
    return (
      <nav className="w-full bg-ground">
        <div className="container-page flex h-14 items-center justify-end gap-4">
          {balanceLinks("/deposit", "flex flex-wrap justify-end")}
          <div className="flex h-10">{connect}</div>
        </div>
      </nav>
    );
  }

  // The front page is the markets index, so "Markets" is the current section there too.
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      {/* Front page head, as on a newspaper: the date and motto on the left, the wallet on the right,
          the name centred in blackletter. Scrolls away. */}
      <header className="container-page hidden pt-5 md:block">
        <div className="flex items-start justify-between gap-6">
          <div className="text-small leading-relaxed">
            <div className="text-ink">{today}</div>
            <div className="text-muted">Time Discovers Truth</div>
          </div>
          <div className="flex h-9 items-stretch">
            {account?.address && <div className="flex items-center pr-5 text-small">{balances}</div>}
            {connect}
          </div>
        </div>
        <Link href="/" className="masthead mx-auto mt-1 block w-fit pb-4 text-[76px] text-ink" aria-label="The Citizen, home">
          The Citizen
        </Link>
      </header>

      {/* Sections, centred, over a clean double rule that runs edge to edge. Sticks to the top. */}
      <nav className="sticky top-0 z-30 w-full bg-ground">
        <div className="container-page flex h-14 items-center justify-between md:h-11 md:justify-center">
          <Link href="/" aria-label="The Citizen, home" className="masthead whitespace-nowrap text-[30px] text-ink md:hidden">
            The Citizen
          </Link>

          <ul className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`text-small underline-offset-[6px] transition-colors duration-200 ${isActive(item.href) ? "text-ink underline decoration-1" : "text-ink-2 hover:text-ink"}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="btn btn-outline h-10 w-10 px-0 md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <List size={18} aria-hidden />
          </button>
        </div>
        <div aria-hidden className="h-[5px] border-y border-ink" />
      </nav>

      {/* Phones: full-screen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-ground md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          >
            <div className="container-page flex h-14 items-center justify-between">
              <span className="masthead text-[30px] text-ink">The Citizen</span>
              <button type="button" onClick={() => setMenuOpen(false)} className="btn btn-outline h-11 w-11 px-0" aria-label="Close menu">
                <X size={18} aria-hidden />
              </button>
            </div>
            <ul className="container-page mt-6 flex flex-col">
              {NAV_LINKS.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: reduce ? 0 : 0.05 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className=""
                >
                  <Link href={item.href} className={`serif block border-b border-rule py-4 text-heading font-bold ${isActive(item.href) ? "text-ink" : "text-muted"}`}>
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="container-page mt-auto flex flex-col gap-4 pb-8">
              {account?.address && (
                <div className="flex gap-6 text-small text-muted">
                  <span>
                    Portfolio <span className="num text-ink">${portfolioDisplay}</span>
                  </span>
                  <span>
                    Cash <span className="num text-ink">${cashDisplay}</span>
                  </span>
                </div>
              )}
              <div className="flex h-11">{connect}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
