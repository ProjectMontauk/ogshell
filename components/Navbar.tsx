"use client";

import React, { useEffect, useState } from "react";
import { ConnectButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { client } from "../src/client";
import { useRouter } from "next/navigation";
import { tokenContract } from "../constants/contracts";
import { inAppWallet, createWallet} from "thirdweb/wallets";
import { base } from "thirdweb/chains";
import { usePortfolio } from "../src/contexts/PortfolioContext";

// TODO: Replace this with the actual ThirdWeb inAppWallet import
// import { InAppWalletButton } from "thirdweb-package-path";

// Add Trade type based on schema.prisma
/*
interface Trade {
  id: number;
  walletAddress: string;
  marketTitle: string;
  marketId: string;
  outcome: string;
  shares: number;
  avgPrice: number;
  betAmount: number;
  toWin: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
*/

function formatBalance(balance: bigint | undefined): string {
  if (!balance) return "0";
  // Divide by 10^18 and show decimal places only when needed
  const amount = Number(balance) / 1e18;
  return amount % 1 === 0 
    ? amount.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type NavbarVariant = "full" | "embed";

type NavbarProps = {
  /** `embed`: partner iframe (?embed=1) — Portfolio + Cash + wallet; no site title / nav links */
  variant?: NavbarVariant;
};

const Navbar = ({ variant = "full" }: NavbarProps) => {
  const router = useRouter();
  const isEmbed = variant === "embed";
  const account = useActiveAccount();
  const { portfolioValue, setPortfolioValue, cashRefreshNonce } = usePortfolio();
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const { data: balance, isPending, refetch } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: [account?.address ?? "0x0000000000000000000000000000000000000000"],
  });

  const isDevelopment = process.env.NODE_ENV !== 'production';

  const wallets = isDevelopment
    ? [
        inAppWallet({
          auth: {
            options: ["google", "apple", "email", "phone", "passkey"] as const,
          },
          smartAccount: {
            chain: base,
            sponsorGas: true,
          },
        }),
        createWallet("io.metamask"),
        createWallet("com.coinbase.wallet"),
        createWallet("me.rainbow"),
        createWallet("io.rabby"),
        createWallet("io.zerion.wallet"),
      ]
    : [
        inAppWallet({
          auth: {
            options: ["google", "apple", "email", "phone", "passkey"] as const,
          },
          smartAccount: {
            chain: base,
            sponsorGas: true,
          },
        }),
        createWallet("io.metamask"),
        createWallet("com.coinbase.wallet"),
        createWallet("me.rainbow"),
        createWallet("io.rabby"),
        createWallet("io.zerion.wallet"),
      ];

  // Fetch cash balance when wallet connects or when a trade/deposit path requests refresh
  useEffect(() => {
    if (!account?.address) return;
    refetch();
  }, [account?.address, refetch]);

  useEffect(() => {
    if (!account?.address || cashRefreshNonce === 0) return;
    void refetch();
  }, [account?.address, cashRefreshNonce, refetch]);

  // Set navbar portfolio display from cash balance only on sign-in (no RPC loop).
  // Full portfolio (cash + positions) is set by the Portfolio page when the user visits it.
  useEffect(() => {
    if (!account?.address) {
      setPortfolioValue("--");
      setPortfolioLoading(false);
      return;
    }
    if (balance === undefined) {
      setPortfolioLoading(true);
      return;
    }
    setPortfolioLoading(false);
    const cash = Number(balance) / 1e18;
    setPortfolioValue(cash.toFixed(2));
  }, [account?.address, balance, setPortfolioValue]);

  const rightControls = (
    <div className="flex items-center gap-1">
      <button
        className="hidden md:flex flex-col items-center justify-center bg-card px-2 py-1 rounded transition-colors duration-200 cursor-pointer focus:outline-none hover:bg-gray-100 dark:hover:bg-white/10"
        style={{ boxShadow: "none", minWidth: 0 }}
        onClick={() => router.push("/portfolio")}
        type="button"
      >
        <span className="text-citizen-ink font-medium text-xs">Portfolio</span>
        <span className="text-green-600 font-semibold text-xs">
          {portfolioLoading || portfolioValue === "--" ? (
            <>$--</>
          ) : (
            <>${Number(portfolioValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}</>
          )}
        </span>
      </button>
      <button
        className="hidden md:flex flex-col items-center justify-center bg-card px-2 py-1 pr-4 m-0 p-0 rounded transition-colors duration-200 cursor-pointer focus:outline-none hover:bg-gray-100 dark:hover:bg-white/10 text-center"
        style={{ boxShadow: "none", minWidth: 0, margin: 0 }}
        onClick={() => router.push("/portfolio")}
        type="button"
      >
        <span className="text-citizen-ink font-medium text-xs">Cash</span>
        <span className="text-green-600 font-semibold text-xs">
          {!account?.address || isPending ? <>$--</> : <>${formatBalance(balance)}</>}
        </span>
      </button>
      <div className="flex scale-75 origin-left">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectButton={{
            label: "Sign In",
            className:
              "bg-black text-white px-4 py-2 rounded transition-colors duration-200 focus:outline-none hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-[10px] font-semibold m-0",
          }}
        />
      </div>
    </div>
  );

  if (isEmbed) {
    return (
      <nav className="w-full border-b border-border bg-background shrink-0">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-end px-4 md:px-6 lg:px-8 py-2 gap-2">
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <button
              className="flex flex-col items-center justify-center bg-card px-2 py-1 rounded transition-colors duration-200 cursor-pointer focus:outline-none hover:bg-gray-100 dark:hover:bg-white/10"
              style={{ boxShadow: "none", minWidth: 0 }}
              onClick={() => router.push("/portfolio")}
              type="button"
            >
              <span className="text-citizen-ink font-medium text-xs">Portfolio</span>
              <span className="text-green-600 font-semibold text-xs">
                {portfolioLoading || portfolioValue === "--" ? (
                  <>$--</>
                ) : (
                  <>${Number(portfolioValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}</>
                )}
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center bg-card px-2 py-1 pr-2 md:pr-4 rounded transition-colors duration-200 cursor-pointer focus:outline-none hover:bg-gray-100 dark:hover:bg-white/10 text-center"
              style={{ boxShadow: "none", minWidth: 0, margin: 0 }}
              onClick={() => router.push("/deposit")}
              type="button"
            >
              <span className="text-citizen-ink font-medium text-xs">Cash</span>
              <span className="text-green-600 font-semibold text-xs">
                {!account?.address || isPending ? <>$--</> : <>${formatBalance(balance)}</>}
              </span>
            </button>
            <div className="flex scale-90 origin-right">
              <ConnectButton
                client={client}
                wallets={wallets}
                connectButton={{
                  label: "Sign In",
                  className:
                    "bg-black text-white px-4 py-2 rounded transition-colors duration-200 focus:outline-none hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-[10px] font-semibold m-0",
                }}
              />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b border-border bg-background">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-4 md:px-6 lg:px-8 py-1">
        <div className="ml-0 flex flex-col items-start">
          <h1 className="text-2xl font-bold text-citizen-ink mt-2">The Citizen</h1>
          <div className="flex gap-0 md:gap-0 mt-1 -ml-2">
            <button
              className="py-1 px-1 md:px-2 bg-transparent text-citizen-ink rounded-md text-[8px] md:text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition border-none shadow-none text-left whitespace-nowrap"
              style={{ minWidth: 0 }}
              onClick={() => router.push("/markets")}
              type="button"
            >
              Markets
            </button>

            <button
              className="py-1 px-1 md:px-2 bg-transparent text-citizen-ink rounded-md text-[8px] md:text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition border-none shadow-none text-left whitespace-nowrap"
              style={{ minWidth: 0 }}
              onClick={() => router.push("/market-ideas")}
              type="button"
            >
              New
            </button>
            <button
              className="py-1 px-1 md:px-2 bg-transparent text-citizen-ink rounded-md text-[8px] md:text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition border-none shadow-none text-left whitespace-nowrap"
              style={{ minWidth: 0 }}
              onClick={() => router.push("/portfolio")}
              type="button"
            >
              Portfolio
            </button>
            <button
              className="py-1 px-1 md:px-2 bg-transparent text-citizen-ink rounded-md text-[8px] md:text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition border-none shadow-none text-left whitespace-nowrap"
              style={{ minWidth: 0 }}
              onClick={() => router.push("/deposit")}
              type="button"
            >
              Deposit
            </button>
            <button
              className="py-1 px-1 md:px-2 bg-transparent text-citizen-ink rounded-md text-[8px] md:text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition border-none shadow-none text-left whitespace-nowrap"
              style={{ minWidth: 0 }}
              onClick={() => router.push("/docs")}
              type="button"
            >
              Docs
            </button>
          </div>
        </div>
        {rightControls}
      </div>
    </nav>
  );
};

export default Navbar;
