"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

interface PortfolioContextType {
  portfolioValue: string;
  setPortfolioValue: (value: string) => void;
  /** Incremented after on-chain cash-affecting actions; Navbar refetches token `balanceOf` when it changes. */
  cashRefreshNonce: number;
  requestCashRefresh: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portfolioValue, setPortfolioValue] = useState<string>("--");
  const [cashRefreshNonce, setCashRefreshNonce] = useState(0);
  const requestCashRefresh = useCallback(() => {
    setCashRefreshNonce((n) => n + 1);
  }, []);
  return (
    <PortfolioContext.Provider
      value={{ portfolioValue, setPortfolioValue, cashRefreshNonce, requestCashRefresh }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error("usePortfolio must be used within a PortfolioProvider");
  return context;
} 