"use client";

import Navbar from "../../../../components/Navbar";
import React, { useState, useEffect, useCallback, use, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, readContract } from "thirdweb";
import { getContractsForMarket, tokenContract } from "../../../../constants/contracts";
import {
  CASH_TOKEN_DECIMALS,
  CASH_TOKEN_SCALE,
  CASH_TOKEN_SCALE_BI,
} from "../../../../constants/tokenUnits";
import { bigintWeiToHumanNumber } from "../../../utils/fixedPointAmount";
import { submitTrade } from "../../../utils/tradeApi";
import { calculateSharesFromBetAmount } from "../../../utils/calculateSharesFromBetAmount";
import { getOutcomePoolBalancesWei } from "../../../utils/poolBalances";
import { quoteCollateralOutWeiForSellAll, quoteCollateralOutWeiForSellShares } from "../../../utils/fpmmSellQuote";
import { getMarketById } from "../../../data/markets";
import { notFound } from "next/navigation";
import { useTheme } from "../../../contexts/ThemeContext";
import { usePortfolio } from "../../../contexts/PortfolioContext";
import { getMarketRedeemDefaults } from "../../../constants/marketRedeemDefaults";
import { CaretDown } from "@phosphor-icons/react";
import TradePanel, { type TradePanelProps } from "../../../components/market/TradePanel";
import OddsChart from "../../../components/market/OddsChart";
import { AutoHeight } from "../../../components/ui/AutoHeight";
import ProbabilityBar from "../../../components/market/ProbabilityBar";
import CaseColumns from "../../../components/market/CaseColumns";
import EvidenceForm from "../../../components/market/EvidenceForm";
import TradeSheet from "../../../components/market/TradeSheet";
import TradeBar from "../../../components/market/TradeBar";
import { useIsDesktop } from "../../../hooks/useIsDesktop";
import { SkeletonLines } from "../../../components/ui/Skeleton";

// Backend API base URL - same-origin Next.js API routes
const API_BASE_URL = '';

function txHashFromResult(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;
  const r = result as Record<string, unknown>;
  const direct = r.transactionHash ?? r.hash;
  if (typeof direct === "string" && direct.startsWith("0x")) return direct;
  const tx = r.transaction;
  if (tx && typeof tx === "object") {
    const t = tx as Record<string, unknown>;
    const inner = t.hash ?? t.transactionHash;
    if (typeof inner === "string" && inner.startsWith("0x")) return inner;
  }
  return undefined;
}

// Define Evidence type
interface Evidence {
  id: number;
  type: 'yes' | 'no';
  title: string;
  url?: string;
  description: string;
  netVotes: number;
  walletAddress: string;
  createdAt?: string;
  commentCount?: number;
}

// Add OddsHistoryEntry type
interface OddsHistoryEntry {
  id: number;
  yesProbability: number;
  noProbability: number;
  timestamp: string;
}

/** Modal used for the wallet and sign-in prompts (copy and buttons as on the original). */
function Dialog({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div aria-hidden className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" />
      <div className="panel relative w-full max-w-sm p-5 shadow-[var(--shadow-float)]">
        <h3 className="text-body font-medium text-ink">{title}</h3>
        <p className="mt-1.5 text-small text-muted">{body}</p>
        <div className="mt-4 flex justify-end gap-2">{children}</div>
      </div>
    </div>
  );
}

function MarketPageContent({ params }: { params: Promise<{ marketId: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const { resolved: themeResolved } = useTheme();
  const isEmbed = searchParams?.get("embed") === "1";
  const market = getMarketById(resolvedParams.marketId);
  
  // If market doesn't exist, show 404
  if (!market) {
    console.error('Market not found for ID:', resolvedParams.marketId);
    notFound();
  }

  // Helper function to truncate one digit from the end of a number string
  const truncateOneDigit = (num: number): string => {
    const numStr = num.toString();
    if (numStr.includes('.')) {
      // If it's a decimal number, remove the last digit
      return numStr.slice(0, -1);
    } else {
      // If it's a whole number, convert to decimal and remove last digit
      return (num / 10).toString();
    }
  };

  const account = useActiveAccount();
  const router = useRouter();
  const { requestCashRefresh } = usePortfolio();

  // Get contracts and position IDs based on market ID
  const { marketContract, conditionalTokensContract, outcome1PositionId, outcome2PositionId, outcomeTokenDecimals } =
    getContractsForMarket(market.id);
  const outcomeScale = 10 ** outcomeTokenDecimals;
  const redeemDefaults = getMarketRedeemDefaults(market.id);
  const tradingResolved = Boolean(market.tradingResolved);
  const forceFpmmDevTrading = searchParams?.get("fpmmDevTrading") === "1";
  const showFpmmTradingUi = !tradingResolved || forceFpmmDevTrading;

  // For Your Balance card - use market-specific PositionIDs
  const [outcome1Balance, setOutcome1Balance] = useState<string>("--");
  const [outcome2Balance, setOutcome2Balance] = useState<string>("--");
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  /** Snapshot winning outcome shares when user starts redeem (chain read before wallet). */
  const preRedeemWinningRef = useRef<{ shares: number; outcomeLabel: string } | null>(null);

  // Only show placeholders when we don't have chain data yet — never wipe known numbers during refetch
  const formatOutcomeSharesCell = (loading: boolean, balanceStr: string) => {
    if (loading && balanceStr === '--') return '...';
    if (balanceStr !== '--' && balanceStr !== 'Error') return parseFloat(balanceStr).toFixed(1);
    return balanceStr;
  };

  // Outcome indices: 0 = Yes, 1 = No (passed to FPMM calcBuyAmount / calcSellAmount)
  const YES_OUTCOME_INDEX = 0;
  const NO_OUTCOME_INDEX = 1;

  // FPMM odds: calcBuyAmount(1 USDC in 6 decimals, outcomeIndex) -> normalized to 2^64 for display
  const INVESTMENT_AMOUNT = CASH_TOKEN_SCALE_BI;
  const [fpmmOddsYes, setFpmmOddsYes] = useState<bigint | undefined>(undefined);
  const [fpmmOddsNo, setFpmmOddsNo] = useState<bigint | undefined>(undefined);
  const [fpmmOddsLoading, setFpmmOddsLoading] = useState(false);

  const fetchFpmmOdds = useCallback(async () => {
    setFpmmOddsLoading(true);
    try {
      // Temporary UI odds for undeployed / placeholder markets.
      const { getMockProbs } = await import("../../../data/mockMarketOdds");
      const mock = getMockProbs(market.id);
      const isPlaceholder =
        !market.contractAddress ||
        market.contractAddress.toLowerCase() === "0x0000000000000000000000000000000000000000";
      if (mock && isPlaceholder) {
        setFpmmOddsYes(BigInt(Math.round(mock.yes * 2 ** 64)));
        setFpmmOddsNo(BigInt(Math.round(mock.no * 2 ** 64)));
        return;
      }

      const [sharesYes, sharesNo] = await Promise.all([
        readContract({
          contract: marketContract,
          method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
          params: [INVESTMENT_AMOUNT, 0n],
        }),
        readContract({
          contract: marketContract,
          method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
          params: [INVESTMENT_AMOUNT, 1n],
        }),
      ]);
      const invHuman = bigintWeiToHumanNumber(INVESTMENT_AMOUNT, CASH_TOKEN_DECIMALS);
      const sY = bigintWeiToHumanNumber(
        typeof sharesYes === "bigint" ? sharesYes : BigInt(String(sharesYes)),
        outcomeTokenDecimals
      );
      const sN = bigintWeiToHumanNumber(
        typeof sharesNo === "bigint" ? sharesNo : BigInt(String(sharesNo)),
        outcomeTokenDecimals
      );
      if (sY <= 0 || sN <= 0) return;
      const oddsYesRaw = invHuman / sY;
      const oddsNoRaw = invHuman / sN;
      const probYes = oddsYesRaw / (oddsYesRaw + oddsNoRaw);
      const probNo = oddsNoRaw / (oddsYesRaw + oddsNoRaw);
      setFpmmOddsYes(BigInt(Math.round(probYes * 2 ** 64)));
      setFpmmOddsNo(BigInt(Math.round(probNo * 2 ** 64)));
    } catch (e) {
      console.error("FPMM calcBuyAmount odds error:", e);
      setFpmmOddsYes(undefined);
      setFpmmOddsNo(undefined);
    } finally {
      setFpmmOddsLoading(false);
    }
  }, [marketContract, outcomeTokenDecimals, market.id, market.contractAddress]);

  useEffect(() => {
    fetchFpmmOdds();
  }, [fetchFpmmOdds]);

  // Evidence tabs (Yes / No / Submit): default visible tab from market-implied odds once per market load.
  const [evidenceTabIndex, setEvidenceTabIndex] = useState(0);
  const evidenceTabOddsInitForMarketRef = useRef<string | null>(null);

  useEffect(() => {
    evidenceTabOddsInitForMarketRef.current = null;
    setEvidenceTabIndex(0);
  }, [market.id]);

  useEffect(() => {
    if (fpmmOddsLoading) return;
    if (fpmmOddsYes === undefined || fpmmOddsNo === undefined) return;
    if (evidenceTabOddsInitForMarketRef.current === market.id) return;
    evidenceTabOddsInitForMarketRef.current = market.id;
    const scale = Math.pow(2, 64);
    const pYes = Number(fpmmOddsYes) / scale;
    const pNo = Number(fpmmOddsNo) / scale;
    if (pYes > 0.5) setEvidenceTabIndex(0);
    else if (pNo > 0.5) setEvidenceTabIndex(1);
    else setEvidenceTabIndex(0);
  }, [market.id, fpmmOddsYes, fpmmOddsNo, fpmmOddsLoading]);

  const oddsYes = fpmmOddsYes;
  const oddsNo = fpmmOddsNo;
  const refetchOddsFromContract = useCallback(() => {
    fetchFpmmOdds();
  }, [fetchFpmmOdds]);

  const [showRules, setShowRules] = useState(false);
  const rulesShort = market.rules;
  const rulesFull = market.rules;

  // Get only the first sentence for the collapsed view
  const firstLine = rulesShort.split(".")[0] + ".";

  // Split rules into paragraphs for better formatting
  function splitRules(text: string) {
    // Split by double newlines first
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    // If we have multiple paragraphs, return them as separate elements
    if (paragraphs.length > 1) {
      return paragraphs;
    }
    
    // Fallback: split into 3 paragraphs: Yes condition, No condition, Resolution statement
    const parts = [];
    
    // Split at "Otherwise, the market will resolve 'No.'"
    const noSplit = "Otherwise, the market will resolve 'No.'";
    const noIdx = text.indexOf(noSplit);
    
    if (noIdx !== -1) {
      // First part: Yes condition (everything before "Otherwise")
      parts.push(text.slice(0, noIdx).trim());
      
      // Find where resolution statement starts
      const resolutionSplit = "The market will resolve as soon as";
      const resolutionIdx = text.indexOf(resolutionSplit);
      
      if (resolutionIdx !== -1) {
        // Second part: No condition + clarification (from "Otherwise" to resolution)
        parts.push(text.slice(noIdx, resolutionIdx).trim());
        // Third part: Resolution statement
        parts.push(text.slice(resolutionIdx).trim());
      } else {
        // No resolution statement found, just split at "Otherwise"
        parts.push(text.slice(noIdx).trim());
      }
    } else {
      // No "Otherwise" found, return as single paragraph
      parts.push(text);
    }
    
    return parts.filter(p => p.trim());
  }

  // Replace individual yesMode and noMode with a single mode state
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');

  // Replace individual yesAmount and noAmount with a single amount state
  const [amount, setAmount] = useState("");

  const [, setBuyFeedback] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  /** Shown above “Your positions” after a successful conditional-tokens redeem + balance refresh. */
  const [redeemSuccessMessage, setRedeemSuccessMessage] = useState<string | null>(null);
  const [showWalletError, setShowWalletError] = useState(false);

// Buy mode: simple cost display (amount entered)
  const [buyCostDisplay, setBuyCostDisplay] = useState<string | null>(null);
  const [buyCostLoading, setBuyCostLoading] = useState(false);
  // JFK FPMM buy: output of calcBuyAmount (est. shares received)
  const [buyEstSharesDisplay, setBuyEstSharesDisplay] = useState<string | null>(null);
  const [buyEstSharesLoading, setBuyEstSharesLoading] = useState(false);
  // Sell mode: user enters desired collateral; we quote required shares via calcSellAmount.
  const [sellEstSharesDisplay, setSellEstSharesDisplay] = useState<string | null>(null);
  const [sellEstSharesLoading, setSellEstSharesLoading] = useState(false);

  const [tradeFeedback, setTradeFeedback] = useState<string | null>(null);
  /** Covers wallet confirmation + post-send settlement (until balances refresh completes). */
  const [tradeInProgress, setTradeInProgress] = useState(false);

  /** Frozen Max Win / Receive / Avg Price / shares after a completed trade while input is cleared */
  type PostTradeQuoteSnapshot = {
    mode: 'buy' | 'sell';
    outcome: 'yes' | 'no';
    maxWinDisplay: string | null;
    receiveDisplay: string | null;
    avgPriceDisplay: string;
    sellSharesDisplay: string | null;
  };
  const [postTradeQuoteSnapshot, setPostTradeQuoteSnapshot] = useState<PostTradeQuoteSnapshot | null>(null);

  const dismissTradeSuccess = useCallback(() => {
    setSuccessMessage(null);
    setPostTradeQuoteSnapshot(null);
  }, []);

  const fpmmTradingPanelRefMobile = useRef<HTMLDivElement>(null);
  const fpmmTradingPanelRefDesktop = useRef<HTMLDivElement>(null);

  /** Success state stays until user clicks outside trading panels (desktop + mobile placements). */
  useEffect(() => {
    if (!successMessage) return;
    const onPointerDown = (e: PointerEvent) => {
      const node = e.target as Node;
      const inMobile = fpmmTradingPanelRefMobile.current?.contains(node);
      const inDesktop = fpmmTradingPanelRefDesktop.current?.contains(node);
      if (!inMobile && !inDesktop) dismissTradeSuccess();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [successMessage, dismissTradeSuccess]);

  // For Buy Yes
  const { mutate: sendBuyYesTransaction, status: buyYesStatus } = useSendTransaction();
  // For Buy No
  const { mutate: sendBuyNoTransaction, status: buyNoStatus } = useSendTransaction();
  // Generic transaction sender (used by FPMM buy/sell helpers below)
  const { mutate: sendTradeTransaction, status: tradeStatus } = useSendTransaction();

  const yesIndex = BigInt(0);
  const noIndex = BigInt(1);

  // For allowance check
  const { data: allowance, isPending: isAllowancePending, refetch: refetchAllowance } = useReadContract({
    contract: tokenContract,
    method: "function allowance(address owner, address spender) view returns (uint256)",
    params: [account?.address || "", marketContract.address || ""],
  });
  const { mutate: sendApproveTransaction } = useSendTransaction();

  // Get user's ERC20 token balance (cash)
  const { data: userTokenBalance, refetch: refetchUserTokenBalance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address owner) view returns (uint256)",
    params: [account?.address || ""],
  });

  // Convert to 64x64 fixed point
  const userDeposit = userTokenBalance ? BigInt(userTokenBalance) * BigInt(2 ** 64) : 0n;

  const handleApproveIfNeeded = async () => {
    if (isAllowancePending || !account?.address) {
      console.error('Approval: allowance pending or no account', { isAllowancePending, account });
      return false;
    }
    if (!allowance || BigInt(allowance) < userDeposit) {
      const transaction = prepareContractCall({
        contract: tokenContract,
        method: "function approve(address spender, uint256 value) returns (bool)",
        params: [marketContract.address, userDeposit],
      });
      let approved = false;
      await new Promise((resolve) => {
        sendApproveTransaction(transaction, {
          onSuccess: async () => {
            console.log('Approval transaction succeeded');
            // Wait 4 seconds after approval
            await new Promise((r) => setTimeout(r, 4000));
            refetchAllowance();
            approved = true;
            resolve(true);
          },
          onError: (error) => {
            console.error('Approval transaction failed', error);
            resolve(false);
          },
        });
      });
      if (!approved) {
        console.error('Approval: transaction did not complete successfully');
      }
      return approved;
    }
    console.log('Approval: allowance sufficient', { allowance, userDeposit });
    return false;
  };

  // Wrap the buy handler to check approval first
  const handleWalletCheck = () => {
    if (!account?.address) {
      setShowWalletError(true);
      setTimeout(() => setShowWalletError(false), 10000);
      return false;
    }
    return true;
  };

  const handleBuyYesWithApproval = async (amount: string) => {
    if (!handleWalletCheck()) return;
    const usdAmount = parseFloat(amount);
    // userTokenBalance is USDC base units (6 decimals); usdAmount is in dollars
    // If userTokenBalance is undefined, treat as 0
    const cashAvailable = userTokenBalance ? Number(userTokenBalance) / CASH_TOKEN_SCALE : 0;
    if (usdAmount > cashAvailable) {
      setBuyFeedback("Please bet less than cash available!"); 
      setTimeout(() => setBuyFeedback(null), 3000);
      return;
    }
    setBuyFeedback("Checking approval (0/3)");
    const approved = await handleApproveIfNeeded();
    if (approved || (allowance && Number(allowance) >= userDeposit)) {
      setBuyFeedback(null);
      handleBuyYes(amount);
    } else {
      console.error('Approval failed or not completed', { approved, allowance, userDeposit });
      setBuyFeedback("Approval failed or not completed.");
    }
  };

  // Buy/Sell handlers
  const handleBuyYes = async (amount: string) => {
    if (!amount || !account?.address) return;
    setBuyFeedback("Preparing transaction (1/3)");
    const usdAmount = parseFloat(amount);
    
    // Convert full amount to USDC (6 decimals on Base mainnet)
    const betAmountInUSDC = BigInt(Math.floor(usdAmount * CASH_TOKEN_SCALE));
    
    // Get the exact shares that will be received (using discounted amount for preview)
    const discountedBetAmount = usdAmount * 0.99;
    const discountedBetAmountInUSDC = BigInt(Math.floor(discountedBetAmount * CASH_TOKEN_SCALE));
    
    let sharesToBuy: number;
    try {
      const sharesResult = await calculateSharesFromBetAmount(
        conditionalTokensContract,
        marketContract.address as string,
        outcome1PositionId,
        outcome2PositionId,
        0,
        discountedBetAmountInUSDC,
        { outcomeTokenDecimals }
      );
      sharesToBuy = bigintWeiToHumanNumber(
        typeof sharesResult === "bigint" ? sharesResult : BigInt(String(sharesResult)),
        outcomeTokenDecimals
      );
      if (isNaN(sharesToBuy) || sharesToBuy <= 0) {
        setBuyFeedback("Invalid price calculation. Please try again.");
        setTimeout(() => setBuyFeedback(null), 3000);
        return;
      }
    } catch (error) {
      console.error("calculateSharesFromBetAmount error:", error);
      setBuyFeedback("Please input a lower bet amount");
      setTimeout(() => setBuyFeedback(null), 3000);
      return;
    }
    const transaction = prepareContractCall({
      contract: marketContract,
      method: "function buy(uint256 _outcome, uint256 _betAmount) returns (uint256 shares)",
      params: [yesIndex, betAmountInUSDC],
    });
    sendBuyYesTransaction(transaction, {
      onError: (error) => {
          console.error("=== BUY YES TRANSACTION ERROR ===");
          console.error("Error object:", error);
          console.error("Error type:", typeof error);
          console.error("Error message:", error?.message);
          console.error("Error name:", error?.name);
          console.error("Error stack:", error?.stack);
          console.error("Error properties:", Object.getOwnPropertyNames(error || {}));
          console.error("Transaction details:", transaction);
          console.error("USD amount:", usdAmount);
          console.error("Shares to buy:", sharesToBuy);
          console.error("Parsed amount:", betAmountInUSDC.toString());
          console.error("Price result:", priceResult?.toString());
          console.error("Is price pending:", isPricePending);
          console.error("Price error:", priceError);
          console.error("==================================");
          
          let errorMessage = "Purchase failed. Please try again.";
          if (error?.message) {
            const msg = error.message.toLowerCase();
            if (msg.includes("insufficient funds")) {
              errorMessage = "Insufficient funds for transaction.";
            } else if (msg.includes("user rejected") || msg.includes("user denied transaction signature")) {
              errorMessage = "User cancelled transaction";
            } else if (msg.includes("gas")) {
              errorMessage = "Gas estimation failed. Try a smaller amount.";
            } else if (msg.includes("revert")) {
              errorMessage = "Transaction reverted. Check your input.";
            } else if (msg.includes("execution reverted")) {
              errorMessage = "Contract execution failed. Check your input.";
            }
          }
          
          setBuyFeedback(errorMessage);
      },
        onSuccess: async (result) => {
          console.log("Buy Yes transaction successful:", result);
          setBuyFeedback("Transaction submitted (2/3)");
          setAmount("");
          
                // Submit trade to database
      try {
        const avgPrice = usdAmount / sharesToBuy;
        const tradeData = {
          walletAddress: account?.address || '',
          marketTitle: market.title,
          marketId: market.id, // Use the market ID string directly
          outcome: "Yes",
          shares: sharesToBuy,
          avgPrice: avgPrice,
          betAmount: usdAmount,
          toWin: sharesToBuy - usdAmount, // Update this formula as needed
          status: "OPEN"
        };
        
        const tradeResult = await submitTrade(tradeData);
        if (tradeResult) {
          console.log("Trade submitted to database successfully");
        } else {
          console.log("Trade submitted to database (no response)");
        }
      } catch (error) {
        console.error("Failed to submit trade to database:", error);
        // Don't show error to user since the blockchain transaction was successful
      }
          
          // Wait for transaction confirmation and update balances
          await waitForTransactionConfirmation(result, "Purchase Successful! (3/3)");
          
          // Record odds in the background (don't wait for it)
          recordNewOdds();
      },
      onSettled: () => {
        setTimeout(() => {
          setBuyFeedback(null);
        }, 10000);
      }
    });
  };

  const handleBuyNo = async (amount: string) => {
    if (!amount || !account?.address) return;
    setBuyFeedback("Preparing transaction (1/3)");
    const usdAmount = parseFloat(amount);
    
    // USDC (6 decimals on Base mainnet)
    const betAmountInUSDC = BigInt(Math.floor(usdAmount * CASH_TOKEN_SCALE));
    
    // Get the exact shares that will be received (using discounted amount for preview)
    const discountedBetAmount = usdAmount * 0.99;
    const discountedBetAmountInUSDC = BigInt(Math.floor(discountedBetAmount * CASH_TOKEN_SCALE));
    
    let sharesToBuy: number;
    try {
      const sharesResult = await calculateSharesFromBetAmount(
        conditionalTokensContract,
        marketContract.address as string,
        outcome1PositionId,
        outcome2PositionId,
        1,
        discountedBetAmountInUSDC,
        { outcomeTokenDecimals }
      );
      sharesToBuy = bigintWeiToHumanNumber(
        typeof sharesResult === "bigint" ? sharesResult : BigInt(String(sharesResult)),
        outcomeTokenDecimals
      );
      if (isNaN(sharesToBuy) || sharesToBuy <= 0) {
        setBuyFeedback("Invalid price calculation. Please try again.");
        setTimeout(() => setBuyFeedback(null), 3000);
        return;
      }
    } catch (error) {
      console.error("calculateSharesFromBetAmount error:", error);
      setBuyFeedback("Please input a lower bet amount");
      setTimeout(() => setBuyFeedback(null), 3000);
      return;
    }
    const transaction = prepareContractCall({
      contract: marketContract,
      method: "function buy(uint256 _outcome, uint256 _betAmount) returns (uint256 shares)",
      params: [noIndex, betAmountInUSDC],
    });
    sendBuyNoTransaction(transaction, {
      onError: (error) => {
          console.error("=== BUY NO TRANSACTION ERROR ===");
          console.error("Error object:", error);
          console.error("Error type:", typeof error);
          console.error("Error message:", error?.message);
          console.error("Error name:", error?.name);
          console.error("Error stack:", error?.stack);
          console.error("Error properties:", Object.getOwnPropertyNames(error || {}));
          console.error("Transaction details:", transaction);
          console.error("USD amount:", usdAmount);
          console.error("Shares to buy:", sharesToBuy);
          console.error("Parsed amount:", betAmountInUSDC.toString());
          console.error("Price result:", priceResult?.toString());
          console.error("Is price pending:", isPricePending);
          console.error("Price error:", priceError);
          console.error("==================================");
          
          let errorMessage = "Purchase failed. Please try again.";
          if (error?.message) {
            const msg = error.message.toLowerCase();
            if (msg.includes("insufficient funds")) {
              errorMessage = "Insufficient funds for transaction.";
            } else if (msg.includes("user rejected") || msg.includes("user denied transaction signature")) {
              errorMessage = "User cancelled transaction";
            } else if (msg.includes("gas")) {
              errorMessage = "Gas estimation failed. Try a smaller amount.";
            } else if (msg.includes("revert")) {
              errorMessage = "Transaction reverted. Check your input.";
            } else if (msg.includes("execution reverted")) {
              errorMessage = "Contract execution failed. Check your input.";
            }
          }
          
          setBuyFeedback(errorMessage);
      },
              onSuccess: async (result) => {
        console.log("Buy No transaction successful:", result);
        setBuyFeedback("Transaction submitted (2/3)");
        setAmount("");
          
          // Submit trade to database
          try {
            const avgPrice = usdAmount / sharesToBuy;
            const tradeData = {
              walletAddress: account?.address || '',
              marketTitle: market.title,
              marketId: market.id, // Use the market ID string directly
              outcome: "No",
              shares: sharesToBuy,
              avgPrice: avgPrice,
              betAmount: usdAmount,
              toWin: sharesToBuy - usdAmount, // Update this formula as needed
              status: "OPEN"
            };
            
                    const tradeResult = await submitTrade(tradeData);
        if (tradeResult) {
          console.log("Trade submitted to database successfully");
        } else {
          console.log("Trade submitted to database (no response)");
        }
          } catch (error) {
            console.error("Failed to submit trade to database:", error);
            // Don't show error to user since the blockchain transaction was successful
          }
          
          // Wait for transaction confirmation and update balances
          await waitForTransactionConfirmation(result, "Purchase Successful! (3/3)");
          
          // Record odds in the background (don't wait for it)
          recordNewOdds();
      },
      onSettled: () => {
        setTimeout(() => {
          setBuyFeedback(null);
        }, 10000);
      }
    });
  };

  const handleBuyNoWithApproval = async (amount: string) => {
    if (!handleWalletCheck()) return;
    const usdAmount = parseFloat(amount);
    const cashAvailable = userTokenBalance ? Number(userTokenBalance) / CASH_TOKEN_SCALE : 0;
    if (usdAmount > cashAvailable) {
      setBuyFeedback("Please bet less than cash available");
      setTimeout(() => setBuyFeedback(null), 3000);
      return;
    }
    setBuyFeedback("Checking approval (0/3)");
    const approved = await handleApproveIfNeeded();
    if (approved || (allowance && Number(allowance) >= userDeposit)) {
      setBuyFeedback(null);
      handleBuyNo(amount);
    } else {
      setBuyFeedback("Approval failed or not completed.");
    }
  };

  // For Sell Yes
  const { mutate: sendSellYesTransaction } = useSendTransaction();
  // For Sell No
  const { mutate: sendSellNoTransaction } = useSendTransaction();

  // Note: Buy functions convert USD input to shares using priceResult
  // Sell functions expect share input directly (no conversion needed)
  const handleSellYes = (amount: string) => {
    if (!amount || !account?.address) return;
    
    setBuyFeedback("Preparing transaction (1/3)");
    
    // For sell functions, input is number of shares — pass through as-is (no wei scaling)
    const shareAmount = parseFloat(amount);
    const parsedAmount = BigInt(Math.floor(shareAmount));
    
    const transaction = prepareContractCall({
      contract: marketContract,
      method: "function sell(uint256 _outcome, int128 _amount) returns (int128 _price)",
      params: [yesIndex, parsedAmount],
    });
    
    sendSellYesTransaction(transaction, {
      onError: (error) => {
        console.error("=== SELL YES TRANSACTION ERROR ===");
        console.error("Error object:", error);
        console.error("Error message:", error.message);
        console.error("Error name:", error.name);
        console.error("Error stack:", error.stack);
        console.error("Error properties:", Object.getOwnPropertyNames(error));
        console.error("Transaction details:", transaction);
        console.error("Share amount:", shareAmount);
        console.error("Parsed amount:", parsedAmount.toString());
        console.error("==================================");
        
        let errorMessage = "Sale failed. Please try again.";
        
        // More detailed error analysis
        if (error.message) {
          const msg = error.message.toLowerCase();
          if (msg.includes("insufficient funds")) {
            errorMessage = "Insufficient shares to sell.";
          } else if (msg.includes("user rejected") || msg.includes("user denied transaction signature")) {
            errorMessage = "User cancelled transaction";
          } else if (msg.includes("gas")) {
            errorMessage = "Gas estimation failed. Try a smaller amount.";
          } else if (msg.includes("revert")) {
            errorMessage = "Transaction reverted. Check your shares balance.";
          } else if (msg.includes("nonce")) {
            errorMessage = "Transaction nonce error. Try refreshing the page.";
          } else if (msg.includes("execution reverted")) {
            errorMessage = "Contract execution failed. Insufficient shares or invalid amount.";
          } else if (msg.includes("out of gas")) {
            errorMessage = "Transaction ran out of gas. Try a smaller amount.";
          } else if (msg.includes("already known")) {
            errorMessage = "Transaction already submitted. Check your wallet.";
          } else if (msg.includes("0xe237d922")) {
            errorMessage = "Contract error: Insufficient shares or invalid sell amount. Check your balance.";
          } else if (msg.includes("abi error signature not found")) {
            errorMessage = "Contract error: Invalid sell request. Check your shares balance and try a smaller amount.";
          }
        }
        
        setBuyFeedback(errorMessage);
      },
      onSuccess: async (result) => {
        console.log("Sell Yes transaction successful:", result);
        setBuyFeedback("Transaction submitted (2/3)");
        setAmount("");
        
        // Wait for transaction confirmation and update balances
        await waitForTransactionConfirmation(result, "Sale Successful! (3/3)");
        
        // Record odds in the background (don't wait for it)
        recordNewOdds();
      },
      onSettled: () => {
        setTimeout(() => {
          setBuyFeedback(null);
        }, 10000);
      }
    });
  };

  const handleSellNo = (amount: string) => {
    if (!amount || !account?.address) return;
    
    setBuyFeedback("Preparing transaction (1/3)");
    
    // For sell functions, input is number of shares — pass through as-is (no wei scaling)
    const shareAmount = parseFloat(amount);
    const parsedAmount = BigInt(Math.floor(shareAmount));
    
    const transaction = prepareContractCall({
      contract: marketContract,
      method: "function sell(uint256 _outcome, int128 _amount) returns (int128 refund)",
      params: [noIndex, parsedAmount],
    });
    
    sendSellNoTransaction(transaction, {
      onError: (error) => {
        console.error("Sell No transaction error:", {
          error,
          message: error.message,
          transaction: transaction,
          shareAmount,
          parsedAmount: parsedAmount.toString()
        });
        
        let errorMessage = "Sale failed. Please try again.";
        if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient shares to sell.";
        } else if (error.message.includes("user rejected") || error.message.includes("user denied transaction signature")) {
          errorMessage = "User cancelled transaction";
        } else if (error.message.includes("gas")) {
          errorMessage = "Gas estimation failed. Try a smaller amount.";
        }
        
        setBuyFeedback(errorMessage);
      },
      onSuccess: async (result) => {
        console.log("Sell No transaction successful:", result);
        setBuyFeedback("Transaction submitted (2/3)");
        setAmount("");
        
        // Wait for transaction confirmation and update balances
        await waitForTransactionConfirmation(result, "Sale Successful! (3/3)");
        
        // Record odds in the background (don't wait for it)
        recordNewOdds();
      },
      onSettled: () => {
        setTimeout(() => {
          setBuyFeedback(null);
        }, 10000);
      }
    });
  };

  // Evidence state
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [votingEvidenceId, setVotingEvidenceId] = useState<number | null>(null);
  const [userVotes, setUserVotes] = useState<Set<number>>(new Set());

  const [showAllYes, setShowAllYes] = useState(false);
  const [showAllNo, setShowAllNo] = useState(false);
  
  // Trading state
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no' | null>(null);
  const [priceResult, setPriceResult] = useState<bigint | undefined>(undefined);
  const [isPricePending, setIsPricePending] = useState(false);
  const [priceError, setPriceError] = useState<Error | null>(null);
  
  // Odds history state
  const [oddsHistory, setOddsHistory] = useState<OddsHistoryEntry[]>([]);
  const [loadingOdds, setLoadingOdds] = useState(true);
  
  // Evidence form state
  const [evidenceType, setEvidenceType] = useState<'yes' | 'no'>('yes');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [uploadType, setUploadType] = useState<'url' | 'pdf'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Add state for evidence submission success message
  const [evidenceSuccessMessage, setEvidenceSuccessMessage] = useState<string | null>(null);
  
  // Add state for sign-in modal
  const [showSignInModal, setShowSignInModal] = useState(false);

// Buy mode: JFK FPMM uses amount as cost (investment)
useEffect(() => {
  if (mode !== 'buy' || !selectedOutcome || !amount) {
    setBuyCostDisplay(null);
    return;
  }
  const num = parseFloat(amount);
  if (Number.isNaN(num) || num <= 0) {
    setBuyCostDisplay(null);
    return;
  }
  setBuyCostDisplay(num.toFixed(2));
  setBuyCostLoading(false);
}, [mode, selectedOutcome, amount]);

// FPMM buy: fetch est. shares from calcBuyAmount(investmentAmount, outcomeIndex)
useEffect(() => {
  if (mode !== 'buy' || !selectedOutcome || !amount) {
    setBuyEstSharesDisplay(null);
    return;
  }
  const num = parseFloat(amount);
  if (Number.isNaN(num) || num <= 0) {
    setBuyEstSharesDisplay(null);
    return;
  }
  let cancelled = false;
  setBuyEstSharesLoading(true);
  setBuyEstSharesDisplay(null);
  const investmentAmount = BigInt(Math.floor(num * CASH_TOKEN_SCALE));
  const outcomeIndex = selectedOutcome === 'yes' ? 0 : 1;
  readContract({
    contract: marketContract,
    method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
    params: [investmentAmount, BigInt(outcomeIndex)],
  })
    .then((sharesWei) => {
      if (cancelled) return;
      const sw = typeof sharesWei === "bigint" ? sharesWei : BigInt(String(sharesWei));
      const sharesHuman = bigintWeiToHumanNumber(sw, outcomeTokenDecimals);
      setBuyEstSharesDisplay(sharesHuman >= 0 ? sharesHuman.toFixed(2) : "--");
    })
    .catch(() => {
      if (!cancelled) setBuyEstSharesDisplay("--");
    })
    .finally(() => {
      if (!cancelled) setBuyEstSharesLoading(false);
    });
  return () => { cancelled = true; };
}, [mode, selectedOutcome, amount, marketContract, outcomeTokenDecimals]);

// Sell mode: quote required shares for a desired collateral return using calcSellAmount(returnAmount, outcomeIndex).
useEffect(() => {
  if (mode !== "sell" || !selectedOutcome || !amount) {
    setSellEstSharesDisplay(null);
    setSellEstSharesLoading(false);
    return;
  }
  const collateralNum = parseFloat(amount);
  if (Number.isNaN(collateralNum) || collateralNum <= 0) {
    setSellEstSharesDisplay(null);
    setSellEstSharesLoading(false);
    return;
  }
  let cancelled = false;
  setSellEstSharesLoading(true);
  setSellEstSharesDisplay(null);
  const returnAmount = BigInt(Math.floor(collateralNum * CASH_TOKEN_SCALE));
  const outcomeIndex = selectedOutcome === "yes" ? 0 : 1;
  readContract({
    contract: marketContract,
    method: "function calcSellAmount(uint256 returnAmount, uint256 outcomeIndex) view returns (uint256)",
    params: [returnAmount, BigInt(outcomeIndex)],
  })
    .then((tokensToSell) => {
      if (cancelled) return;
      const t = typeof tokensToSell === "bigint" ? tokensToSell : BigInt(tokensToSell);
      const sharesHuman = bigintWeiToHumanNumber(t, outcomeTokenDecimals);
      setSellEstSharesDisplay(Number.isFinite(sharesHuman) ? sharesHuman.toFixed(2) : "--");
    })
    .catch(() => {
      if (!cancelled) setSellEstSharesDisplay("--");
    })
    .finally(() => {
      if (!cancelled) setSellEstSharesLoading(false);
    });
  return () => {
    cancelled = true;
  };
}, [mode, selectedOutcome, amount, marketContract, outcomeTokenDecimals]);





  // Fetch odds history function (read-only, for page loads)
  const fetchOddsHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/odds-history?marketId=${market.id}`);
      if (!res.ok) {
        console.error('Failed to fetch odds history:', res.status, res.statusText);
        setOddsHistory([]);
        setLoadingOdds(false);
        return;
      }
      const data = await res.json();
      setOddsHistory(Array.isArray(data) ? data : []);
      setLoadingOdds(false);
    } catch (error) {
      console.error('Error fetching odds history:', error);
      setOddsHistory([]);
      setLoadingOdds(false);
    }
  }, [market.id]);

  useEffect(() => {
    fetchOddsHistory();
  }, [market.id, fetchOddsHistory]);

  // Fetch evidence on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/evidence?marketId=${market.id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setEvidence(data);
        } else {
          console.error('Evidence data is not an array:', data);
          setEvidence([]);
        }
      })
      .catch(error => {
        console.error('Error fetching evidence:', error);
        setEvidence([]);
      });
  }, [market.id]);

  // Fetch user's existing votes to sync state
  const fetchUserVotes = useCallback(async () => {
    if (!account?.address) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/user-votes?walletAddress=${account.address}&marketId=${market.id}`);
      if (res.ok) {
        const userVoteData = await res.json();
        // Assuming the backend returns an array of evidence IDs the user has voted on
        const votedEvidenceIds: Set<number> = new Set(userVoteData.map((vote: { evidenceId: number }) => Number(vote.evidenceId)));
        setUserVotes(votedEvidenceIds);
      }
    } catch (error) {
      console.error('Failed to fetch user votes:', error);
    }
  }, [account?.address, market.id]);

  // Fetch user votes when account changes
  useEffect(() => {
    if (account?.address) {
      fetchUserVotes();
    } else {
      setUserVotes(new Set());
    }
  }, [account?.address, fetchUserVotes]);

  // Fetch user balances: readContract on Conditional Tokens (balanceOf(owner, positionId)) using config CT and position IDs per market
  const fetchUserBalances = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!account?.address) return undefined;

      const silent = options?.silent === true;
      if (!silent) setIsBalanceLoading(true);
      try {
        const balance1 = await readContract({
          contract: conditionalTokensContract,
          method: "function balanceOf(address account, uint256 id) view returns (uint256)",
          params: [account.address as `0x${string}`, BigInt(outcome1PositionId)],
        });
        const balance2 = await readContract({
          contract: conditionalTokensContract,
          method: "function balanceOf(address account, uint256 id) view returns (uint256)",
          params: [account.address as `0x${string}`, BigInt(outcome2PositionId)],
        });
        const b1 = typeof balance1 === "bigint" ? balance1 : BigInt(String(balance1));
        const b2 = typeof balance2 === "bigint" ? balance2 : BigInt(String(balance2));
        const yesHuman = bigintWeiToHumanNumber(b1, outcomeTokenDecimals);
        const noHuman = bigintWeiToHumanNumber(b2, outcomeTokenDecimals);
        setOutcome1Balance(yesHuman.toString());
        setOutcome2Balance(noHuman.toString());
        return { yes: yesHuman, no: noHuman };
      } catch (err) {
        console.error("Error fetching user balances:", err);
        setOutcome1Balance("Error");
        setOutcome2Balance("Error");
        return undefined;
      } finally {
        if (!silent) setIsBalanceLoading(false);
      }
    },
    [account?.address, outcome1PositionId, outcome2PositionId, conditionalTokensContract, outcomeTokenDecimals],
  );

  const handleRedeemStart = useCallback(async () => {
    setRedeemSuccessMessage(null);
    if (!account?.address) {
      preRedeemWinningRef.current = null;
      return;
    }
    const b = await fetchUserBalances({ silent: true });
    if (!b) {
      preRedeemWinningRef.current = null;
      return;
    }
    const [yesLabel, noLabel] = market.outcomes;
    const winningShares = Math.max(b.yes, b.no);
    if (!Number.isFinite(winningShares) || winningShares <= 0) {
      preRedeemWinningRef.current = null;
      return;
    }
    const outcomeLabel = b.yes >= b.no ? yesLabel : noLabel;
    preRedeemWinningRef.current = { shares: winningShares, outcomeLabel };
  }, [account?.address, fetchUserBalances, market.outcomes]);

  const handleRedeemSuccess = useCallback(
    async (txResult?: unknown) => {
      const snap = preRedeemWinningRef.current;
      preRedeemWinningRef.current = null;
      const txHash = txHashFromResult(txResult);
      try {
        await fetchUserBalances({ silent: true });
        await refetchUserTokenBalance();
        requestCashRefresh();
        setRedeemSuccessMessage(
          "Redeem complete. Your Yes/No position balances below are updated; collateral from redeemed tokens is paid to your wallet — check Cash in the header.",
        );

        if (account?.address && snap && snap.shares > 0) {
          try {
            await submitTrade({
              walletAddress: account.address,
              marketTitle: market.title,
              marketId: market.id,
              outcome: snap.outcomeLabel,
              shares: snap.shares,
              avgPrice: 1,
              betAmount: snap.shares,
              toWin: 0,
              status: "SETTLED",
              txHash,
              tradeType: "Redemption",
            });
          } catch (err) {
            console.error("Redemption trade history submit failed:", err);
          }
        }
      } catch (e) {
        console.error("Post-redeem balance refresh failed:", e);
        setRedeemSuccessMessage(
          "Redeem was submitted. If numbers look unchanged, wait a few seconds for the chain to catch up, then refresh the page.",
        );
      }
    },
    [account?.address, market, fetchUserBalances, refetchUserTokenBalance, requestCashRefresh],
  );

  // Fetch user balances once when page loads or wallet connects (no polling — refresh page to update)
  useEffect(() => {
    if (!account?.address) {
      setOutcome1Balance("--");
      setOutcome2Balance("--");
      setIsBalanceLoading(false);
      return;
    }
    fetchUserBalances();
  }, [account?.address, fetchUserBalances]);

  // Debug: log AMM pool balances held by the market maker contract.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { outcome1Wei, outcome2Wei } = await getOutcomePoolBalancesWei(
          conditionalTokensContract,
          marketContract.address,
          outcome1PositionId,
          outcome2PositionId
        );
        if (cancelled) return;
        console.log("[poolBalances]", {
          marketId: market.id,
          marketMakerAddress: marketContract.address,
          outcome1PositionId,
          outcome2PositionId,
          outcome1Wei: outcome1Wei.toString(),
          outcome2Wei: outcome2Wei.toString(),
          outcome1Human: bigintWeiToHumanNumber(outcome1Wei, outcomeTokenDecimals),
          outcome2Human: bigintWeiToHumanNumber(outcome2Wei, outcomeTokenDecimals),
        });

        // Debug: quote collateral out for selling 151.31 shares of outcome 0 (Yes).
        const sharesToSellWei = BigInt(Math.floor(151.31 * outcomeScale));
        const quote = quoteCollateralOutWeiForSellShares({
          outcome1Wei,
          outcome2Wei,
          sharesToSellWei,
          outcomeIndex: 0,
          feeBps: 0n,
        });
        console.log("[sellQuote] 151.31 shares outcome0", {
          sharesToSellWei: sharesToSellWei.toString(),
          collateralOutWei: quote.collateralOutWei.toString(),
          collateralOutHuman: bigintWeiToHumanNumber(quote.collateralOutWei, outcomeTokenDecimals),
        });
      } catch (e) {
        if (!cancelled) console.error("[poolBalances] failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conditionalTokensContract, marketContract.address, market.id, outcome1PositionId, outcome2PositionId, outcomeTokenDecimals]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check file size (10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert(`File size must be less than 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
        e.target.value = ''; // Clear the input
        setSelectedFile(null); // Clear selected file state
        return;
      }
      
      // File is valid
      setSelectedFile(file);
      setUrl(''); // Clear URL when file is selected
    }
  };

  // Handle submit document
  const handleSubmitDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is signed in
    if (!account?.address) {
      setEvidenceSuccessMessage('Please sign-in to contribute information');
      setTimeout(() => setEvidenceSuccessMessage(null), 5000);
      return;
    }
    
    if (!title.trim()) return;
    
    // Validate based on upload type
    if (uploadType === 'url' && !url.trim()) {
      alert('Please enter a URL or switch to PDF upload.');
      return;
    }
    if (uploadType === 'pdf' && !selectedFile) {
      alert('Please select a PDF file or switch to URL.');
      return;
    }

    setIsUploading(true);
    
    try {
      let finalUrl = url.trim();
      
      // If PDF upload, we'll need to upload the file first
      if (uploadType === 'pdf' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('marketId', market.id);
        formData.append('evidenceType', evidenceType);
        formData.append('title', title.trim());
        formData.append('walletAddress', account?.address || '');
        
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload-evidence`, {
          method: 'POST',
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'your-api-key-here',
          },
          body: formData,
        });
        
        if (!uploadRes.ok) {
          throw new Error('Failed to upload PDF');
        }
        
        const uploadResult = await uploadRes.json();
        finalUrl = uploadResult.fileUrl; // Get the uploaded file URL
      }
      
      // Submit evidence with the URL (either original URL or uploaded PDF URL)
      const newEvidence = {
        marketId: market.id,
        type: evidenceType,
        title: title.trim(),
        url: finalUrl,
        description: description.trim(),
        walletAddress: account?.address || '',
      };
      
      const res = await fetch(`${API_BASE_URL}/api/submit-evidence`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
          // No API key needed - handled server-side
        },
        body: JSON.stringify(newEvidence),
      });
      
      const result = await res.json();
      const created = result.success ? result.data : result;
      setEvidence(prev => [created, ...prev]);
      setTitle('');
      setDescription('');
      setUrl('');
      setSelectedFile(null);
      setEvidenceType('yes');
      setUploadType('url');
      setEvidenceSuccessMessage('Evidence Successfully Submitted!');
      setTimeout(() => setEvidenceSuccessMessage(null), 10000);
    } catch (error) {
      console.error('Error submitting evidence:', error);
      setEvidenceSuccessMessage('Error submitting evidence. Please try again.');
      setTimeout(() => setEvidenceSuccessMessage(null), 10000);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle upvote/downvote toggle
  const handleVote = async (id: number, evidenceType: 'yes' | 'no') => {
    if (!account?.address) {
      setShowSignInModal(true);
      return;
    }
    
    // Update user position before voting
    await fetch('/api/update-user-position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marketId: market.id,
        walletAddress: account.address,
        yesShares: parseInt(outcome1Balance) || 0,
        noShares: parseInt(outcome2Balance) || 0,
      }),
    });
    
    // Set loading state for this specific evidence
    setVotingEvidenceId(id);
    
    // Check if user has already voted on this evidence
    const hasVoted = userVotes.has(id);
    
    // Always send 'upvote' to backend - backend will handle toggle logic
    const voteType = 'upvote';
    
    // Calculate the user's full voting weight for this evidence type
    const yesShares = parseInt(outcome1Balance) || 0;
    const noShares = parseInt(outcome2Balance) || 0;
    
    let votingWeight = 1;
    if (evidenceType === 'yes' && yesShares > noShares) {
      votingWeight = Math.max(1, yesShares - noShares);
    } else if (evidenceType === 'no' && noShares > yesShares) {
      votingWeight = Math.max(1, noShares - yesShares);
    }
    
    console.log('Voting weight calculation:', {
      evidenceType,
      yesShares,
      noShares,
      votingWeight,
      outcome1Balance,
      outcome2Balance
    });
    
    // Optimistic update - immediately update the UI
    const optimisticEvidence = evidence.map(ev => {
      if (ev.id === id) {
        return {
          ...ev,
          netVotes: hasVoted 
            ? ev.netVotes - votingWeight  // Remove vote
            : ev.netVotes + votingWeight  // Add vote
        };
      }
      return ev;
    });
    
    // Update UI immediately
    setEvidence(optimisticEvidence);
    
    // Update user votes tracking optimistically
    if (hasVoted) {
      setUserVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } else {
      setUserVotes(prev => new Set(prev).add(id));
    }
    
    try {
      const voteData = { 
        evidenceId: id, 
        walletAddress: account.address,
        voteType: voteType,
        evidenceType: evidenceType,
        marketId: market.id
      };
      
      console.log('Sending vote to backend:', voteData);
      
      const res = await fetch(`${API_BASE_URL}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData),
      });
      
      if (res.ok) {
        // Get the updated evidence with accurate vote counts
        const evidenceRes = await fetch(`${API_BASE_URL}/api/evidence?marketId=${market.id}`);
        const updatedEvidence = await evidenceRes.json();
        setEvidence(updatedEvidence);
        
        // Refresh user votes to get accurate state
        await fetchUserVotes();
      } else {
        // Revert optimistic update on error
        setEvidence(evidence);
        // Revert user votes tracking
        if (hasVoted) {
          setUserVotes(prev => new Set(prev).add(id));
        } else {
          setUserVotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
        
        // Better error handling
        let errorMessage = 'Vote failed';
        try {
          const errorData = await res.json();
          console.error('Vote failed:', {
            status: res.status,
            statusText: res.statusText,
            error: errorData,
            evidenceId: id,
            voteType: voteType,
            evidenceType: evidenceType,
            walletAddress: account.address
          });
          
          errorMessage = errorData.error || errorData.message || 'Vote failed';
        } catch (parseError) {
          console.error('Vote failed - could not parse error response:', {
            status: res.status,
            statusText: res.statusText,
            parseError
          });
        }
        
        // Show error to user (you could add a toast notification here)
        console.error(errorMessage);
      }
    } catch (error) {
      // Revert optimistic update on error
      setEvidence(evidence);
      // Revert user votes tracking
      if (hasVoted) {
        setUserVotes(prev => new Set(prev).add(id));
      } else {
        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
      console.error('Vote error:', error);
    } finally {
      // Clear loading state
      setVotingEvidenceId(null);
    }
  };

  // Filter and sort evidence for Yes/No tabs
  const sortedYesEvidence = (Array.isArray(evidence) ? evidence : []).filter(ev => ev.type === 'yes').sort((a, b) => b.netVotes - a.netVotes);
  const sortedNoEvidence = (Array.isArray(evidence) ? evidence : []).filter(ev => ev.type === 'no').sort((a, b) => b.netVotes - a.netVotes);

  // Show limited evidence initially
  const yesToShow = showAllYes ? sortedYesEvidence : sortedYesEvidence.slice(0, 5);

  // Get user's voting contribution for a specific evidence
  const getUserVotingContribution = (evidenceId: number, evidenceType: 'yes' | 'no') => {
    if (!userVotes.has(evidenceId)) return 0;
    
    const yesShares = parseInt(outcome1Balance) || 0;
    const noShares = parseInt(outcome2Balance) || 0;
    
    if (evidenceType === 'yes' && yesShares > noShares) {
      return Math.max(1, yesShares - noShares);
    } else if (evidenceType === 'no' && noShares > yesShares) {
      return Math.max(1, noShares - yesShares);
    }
    
    return 1; // Base weight
  };

  // Prepare data for chart: group by timestamp, with yes/no as separate lines
  const ODDS_DIVISOR = Number("18446744073709551616");
  const chartData = oddsHistory
    .filter(entry =>
      typeof entry.yesProbability === "number" &&
      typeof entry.noProbability === "number"
    )
    .map(entry => ({
      timestamp: new Date(entry.timestamp).toISOString().slice(0, 10),
      Yes: entry.yesProbability / ODDS_DIVISOR,
      No: entry.noProbability / ODDS_DIVISOR,
    }));

  // Calculate payout and average price for the selected outcome
  let payoutDisplay = '--';
  let avgPriceDisplay = '--';
  if (selectedOutcome && amount && !isNaN(Number(amount)) && Number(amount) > 0) {
    if (mode === 'buy') {
      const investmentAmount = parseFloat(amount);
      payoutDisplay = investmentAmount.toFixed(2);
      // FPMM: Avg. Price = User wager / CalcBuyShares (cost per share in cents)
      if (buyEstSharesDisplay) {
        const calcBuyShares = parseFloat(buyEstSharesDisplay);
        if (Number.isFinite(calcBuyShares) && calcBuyShares > 0) {
          const avgPriceInCents = (investmentAmount / calcBuyShares) * 100;
          avgPriceDisplay = `¢${Math.round(avgPriceInCents)}`;
        }
      }
    } else {
      // Sell mode: Amount = collateral to receive; quote shares required via calcSellAmount.
      const collateralToReceive = parseFloat(amount);
      payoutDisplay = collateralToReceive.toFixed(2);
      if (sellEstSharesLoading) {
        avgPriceDisplay = "--";
      } else if (sellEstSharesDisplay) {
        const sharesToSell = parseFloat(sellEstSharesDisplay);
        if (Number.isFinite(sharesToSell) && sharesToSell > 0) {
          const avgPriceInCents = (collateralToReceive / sharesToSell) * 100;
          avgPriceDisplay = `¢${avgPriceInCents.toFixed(0)}`;
        }
      }
    }
  }

  // Wait for transaction confirmation and update balances
  const waitForTransactionConfirmation = async (transactionResult: unknown, successMessageArg: string) => {
    // Capture quote line items before any await (still have `amount` and live estimates)
    const quoteSnap: PostTradeQuoteSnapshot | null =
      selectedOutcome && amount && !Number.isNaN(Number(amount)) && Number(amount) > 0
        ? mode === 'buy'
          ? (() => {
              const maxWin = buyEstSharesLoading ? null : (buyEstSharesDisplay ?? null);
              let avg: string = '--';
              if (buyEstSharesDisplay) {
                const inv = parseFloat(amount);
                const sh = parseFloat(buyEstSharesDisplay);
                if (Number.isFinite(sh) && sh > 0) avg = `¢${Math.round((inv / sh) * 100)}`;
              }
              return {
                mode: 'buy' as const,
                outcome: selectedOutcome,
                maxWinDisplay: maxWin,
                receiveDisplay: null,
                avgPriceDisplay: avg,
                sellSharesDisplay: null,
              };
            })()
          : (() => {
              const recv = parseFloat(amount).toFixed(2);
              let avg: string = '--';
              const ss = sellEstSharesLoading ? null : (sellEstSharesDisplay ?? null);
              if (ss) {
                const col = parseFloat(amount);
                const sh = parseFloat(ss);
                if (Number.isFinite(sh) && sh > 0) avg = `¢${((col / sh) * 100).toFixed(0)}`;
              }
              return {
                mode: 'sell' as const,
                outcome: selectedOutcome,
                maxWinDisplay: null,
                receiveDisplay: recv,
                avgPriceDisplay: avg,
                sellSharesDisplay: ss,
              };
            })()
        : null;

    try {
      // Transaction is already confirmed when onSuccess runs; refresh balances for UI without toggling Purchased Shares to "..." (avoids blink with Trade Completed).
      await fetchUserBalances({ silent: true });

      await refetchUserTokenBalance();
      requestCashRefresh();

      // Success + button state as soon as Published Shares / cash reflect the trade
      setBuyFeedback(null);
      if (quoteSnap) setPostTradeQuoteSnapshot(quoteSnap);
      setSuccessMessage(successMessageArg);
      setAmount("");
      setTradeInProgress(false);

      // Server + evidence in background (don't block "Trade Completed")
      void (async () => {
        try {
          let latestYesShares = 0;
          let latestNoShares = 0;
          if (account?.address) {
            try {
              const balance1 = await readContract({
                contract: conditionalTokensContract,
                method: "function balanceOf(address account, uint256 id) view returns (uint256)",
                params: [account.address as `0x${string}`, BigInt(outcome1PositionId)],
              });
              const balance2 = await readContract({
                contract: conditionalTokensContract,
                method: "function balanceOf(address account, uint256 id) view returns (uint256)",
                params: [account.address as `0x${string}`, BigInt(outcome2PositionId)],
              });
              const b1 = typeof balance1 === "bigint" ? balance1 : BigInt(String(balance1));
              const b2 = typeof balance2 === "bigint" ? balance2 : BigInt(String(balance2));
              latestYesShares = Math.floor(bigintWeiToHumanNumber(b1, outcomeTokenDecimals));
              latestNoShares = Math.floor(bigintWeiToHumanNumber(b2, outcomeTokenDecimals));
            } catch (err) {
              console.error("Error fetching latest balances for user-position API:", err);
            }
          }

          if (account?.address && market.id) {
            await fetch("/api/update-user-position", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                marketId: market.id,
                walletAddress: account.address,
                yesShares: latestYesShares,
                noShares: latestNoShares,
              }),
            });
            const evidenceRes = await fetch(`/api/evidence?marketId=${market.id}`);
            if (evidenceRes.ok) {
              const updatedEvidence = await evidenceRes.json();
              setEvidence(updatedEvidence);
            }
          }
        } catch (err) {
          console.error("Background post-trade sync failed:", err);
        }
      })();
    } catch (error) {
      console.error("Error waiting for transaction confirmation:", error);
      // Fallback to immediate balance update (silent: same UX as happy path above)
      await fetchUserBalances({ silent: true });
      try {
        await refetchUserTokenBalance();
      } catch {
        /* ignore */
      }
      requestCashRefresh();
      // Still show success after best-effort balance refresh
      setBuyFeedback(null);
      if (quoteSnap) setPostTradeQuoteSnapshot(quoteSnap);
      setSuccessMessage(successMessageArg);
      setAmount(""); // Clear the amount even if there's an error
    } finally {
      setTradeInProgress(false);
    }
  };

  // Calculate user's voting power for Yes and No
  const yesShares = parseInt(outcome1Balance) || 0;
  const noShares = parseInt(outcome2Balance) || 0;
  
  // If user has shares in one position, they have zero voting power for the opposite position
  const yesVotingPower = account?.address ? ((yesShares - noShares) > 0 ? Math.max(1, yesShares - noShares) : 0) : 0;
  const noVotingPower = account?.address ? ((noShares - yesShares) > 0 ? Math.max(1, noShares - yesShares) : 0) : 0;

  // For conditional tokens approval (for selling)
  const { mutate: sendSetApprovalForAll } = useSendTransaction();
  const { data: _isOperatorApprovedSynced, refetch: refetchOperatorApproval } = useReadContract({
    contract: conditionalTokensContract,
    method: "function isApprovedForAll(address owner, address operator) view returns (bool)",
    params: [account?.address || "", marketContract.address || ""],
  });

  const handleSetApprovalForAllIfNeeded = async () => {
    if (!account?.address || !marketContract.address) {
      console.error("ERC1155 approval: missing wallet or market address");
      return false;
    }

    const { data: approvedNow } = await refetchOperatorApproval();
    if (approvedNow === true) return true;

    const transaction = prepareContractCall({
      contract: conditionalTokensContract,
      method: "function setApprovalForAll(address operator, bool approved)",
      params: [marketContract.address, true],
    });

    const ok = await new Promise<boolean>((resolve) => {
      sendSetApprovalForAll(transaction, {
        onSuccess: async () => {
          // Wait until RPC sees operator approval — sell() uses safeTransferFrom as the market.
          for (let i = 0; i < 24; i++) {
            await new Promise((r) => setTimeout(r, 500));
            const { data } = await refetchOperatorApproval();
            if (data === true) {
              resolve(true);
              return;
            }
          }
          resolve(false);
        },
        onError: () => resolve(false),
      });
    });
    return ok;
  };

  // Wrap the sell handlers to check approval first
  const handleSellYesWithApproval = async (amount: string) => {
    if (!handleWalletCheck()) return;
    
    setBuyFeedback("Checking approval (0/3)");
    const approved = await handleSetApprovalForAllIfNeeded();
    if (approved) {
      setBuyFeedback(null);
      handleSellYes(amount);
    } else {
      setBuyFeedback("Approval for selling failed or not completed.");
    }
  };
  const handleSellNoWithApproval = async (amount: string) => {
    if (!handleWalletCheck()) return;
    
    setBuyFeedback("Checking approval (0/3)");
    const approved = await handleSetApprovalForAllIfNeeded();
    if (approved) {
      setBuyFeedback(null);
      handleSellNo(amount);
    } else {
      setBuyFeedback("Approval for selling failed or not completed.");
    }
  };

  // JFK FPMM: buy(investmentAmount, outcomeIndex, minOutcomeTokensToBuy)
  const handleFpmmBuy = async (amount: string) => {
    if (!amount || !selectedOutcome || (selectedOutcome !== "yes" && selectedOutcome !== "no")) return;
    if (!handleWalletCheck()) return;

    const investmentNum = parseFloat(amount);
    if (Number.isNaN(investmentNum) || investmentNum <= 0) return;

    setTradeInProgress(true);
    setBuyFeedback("Trade Submitted");

    const investmentAmount = BigInt(Math.floor(investmentNum * CASH_TOKEN_SCALE));
    const outcomeIndex = selectedOutcome === "yes" ? 0 : 1;

    try {
      const expectedShares = await readContract({
        contract: marketContract,
        method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
        params: [investmentAmount, BigInt(outcomeIndex)],
      });
      const minOutcomeTokensToBuy = (expectedShares * 95n) / 100n;

      setTradeFeedback("Preparing trade...");
      const approved = await handleApproveIfNeeded();
      if (!approved && (!allowance || BigInt(allowance) < investmentAmount)) {
        setBuyFeedback("Approval failed or incomplete. Please try again.");
        setTradeFeedback(null);
        setTradeInProgress(false);
        setTimeout(() => setBuyFeedback(null), 6000);
        return;
      }

      const tx = prepareContractCall({
        contract: marketContract,
        method: "function buy(uint256 investmentAmount, uint256 outcomeIndex, uint256 minOutcomeTokensToBuy)",
        params: [investmentAmount, BigInt(outcomeIndex), minOutcomeTokensToBuy],
      });

      sendTradeTransaction(tx, {
        onError: (error: unknown) => {
          console.error("FPMM buy() error:", error);
          const msg =
            typeof error === "object" && error !== null && "message" in error
              ? String((error as { message?: string }).message || "").toLowerCase()
              : "";
          let friendly = "Buy failed. Check your inputs and try again.";
          if (msg.includes("user rejected") || msg.includes("denied"))
            friendly = "Transaction cancelled in wallet.";
          else if (msg.includes("insufficient"))
            friendly = "Insufficient balance or approval for this trade.";
          else if (msg.includes("revert") || msg.includes("minimum"))
            friendly = "Transaction reverted. Try a smaller amount or try again.";
          setBuyFeedback(friendly);
          setTradeFeedback(null);
          setTradeInProgress(false);
          setTimeout(() => setBuyFeedback(null), 8000);
        },
        onSuccess: async (result: unknown) => {
          setBuyFeedback("Trade Submitted");
          // Record trade to DB (best-effort, don't block UX)
          try {
            if (account?.address) {
              const es =
                typeof expectedShares === "bigint" ? expectedShares : BigInt(String(expectedShares));
              const sharesHuman = bigintWeiToHumanNumber(es, outcomeTokenDecimals);
              const avgPrice = sharesHuman > 0 ? investmentNum / sharesHuman : 0;
              await submitTrade({
                walletAddress: account.address,
                marketTitle: market.title,
                marketId: market.id,
                outcome: selectedOutcome === "yes" ? "Yes" : "No",
                shares: sharesHuman,
                avgPrice,
                betAmount: investmentNum,
                toWin: sharesHuman - investmentNum,
                status: "OPEN",
                txHash: txHashFromResult(result),
                tradeType: "BUY",
              });
            }
          } catch (err) {
            console.error("Failed to submit FPMM buy trade to DB:", err);
          }
          await waitForTransactionConfirmation(result, "Trade Completed");
          recordNewOdds();
          setTradeFeedback(null);
        },
        onSettled: () => {},
      });
    } catch (e) {
      console.error("FPMM buy error:", e);
      setBuyFeedback("Trade failed. Check your input and try again.");
      setTradeFeedback(null);
      setTradeInProgress(false);
      setTimeout(() => setBuyFeedback(null), 4000);
    }
  };

  // JFK FPMM: sell(returnAmount, outcomeIndex, maxOutcomeTokensToSell).
  // UI input (sell mode) is COLLATERAL to receive; shares-to-sell are quoted via calcSellAmount(returnAmount,...).
  // We set maxOutcomeTokensToSell to the user's owned shares for the selected outcome.
  const handleFpmmSell = async (amount: string) => {
    if (!amount || !selectedOutcome || (selectedOutcome !== "yes" && selectedOutcome !== "no")) return;
    if (!handleWalletCheck()) return;

    const collateralNum = parseFloat(amount);
    if (Number.isNaN(collateralNum) || collateralNum <= 0) return;

    setTradeInProgress(true);
    setBuyFeedback("Preparing sell...");
    const outcomeIndex = selectedOutcome === "yes" ? 0 : 1;
    const ownedSharesHuman =
      selectedOutcome === "yes"
        ? outcome1Balance !== "--" && outcome1Balance !== "Error"
          ? parseFloat(outcome1Balance)
          : 0
        : outcome2Balance !== "--" && outcome2Balance !== "Error"
          ? parseFloat(outcome2Balance)
          : 0;
    const maxOutcomeTokensToSell = BigInt(Math.floor(Math.max(0, ownedSharesHuman) * outcomeScale));

    try {
      if (maxOutcomeTokensToSell <= 0n) {
        setBuyFeedback("No shares available to sell for the selected outcome.");
        setTradeFeedback(null);
        setTradeInProgress(false);
        setTimeout(() => setBuyFeedback(null), 5000);
        return;
      }

      const returnAmount = BigInt(Math.floor(collateralNum * CASH_TOKEN_SCALE));
      const tokensToSell = await readContract({
        contract: marketContract,
        method: "function calcSellAmount(uint256 returnAmount, uint256 outcomeIndex) view returns (uint256)",
        params: [returnAmount, BigInt(outcomeIndex)],
      });
      const tokensToSellBig = typeof tokensToSell === "bigint" ? tokensToSell : BigInt(tokensToSell);
      if (tokensToSellBig > maxOutcomeTokensToSell) {
        setBuyFeedback("You don't have enough shares to receive that much collateral. Try a smaller amount.");
        setTradeFeedback(null);
        setTradeInProgress(false);
        setTimeout(() => setBuyFeedback(null), 6000);
        return;
      }

      setTradeFeedback("Checking approval...");
      const approved = await handleSetApprovalForAllIfNeeded();
      if (!approved) {
        setBuyFeedback("Approval to sell outcome tokens failed or not completed.");
        setTradeFeedback(null);
        setTradeInProgress(false);
        setTimeout(() => setBuyFeedback(null), 6000);
        return;
      }

      setTradeFeedback("Preparing trade...");
      const tx = prepareContractCall({
        contract: marketContract,
        method: "function sell(uint256 returnAmount, uint256 outcomeIndex, uint256 maxOutcomeTokensToSell)",
        params: [returnAmount, BigInt(outcomeIndex), maxOutcomeTokensToSell],
      });

      sendTradeTransaction(tx, {
        onError: (error: unknown) => {
          console.error("FPMM sell() error:", error);
          const msg =
            typeof error === "object" && error !== null && "message" in error
              ? String((error as { message?: string }).message || "").toLowerCase()
              : "";
          let friendly = "Sell failed. Check your inputs and balance.";
          if (msg.includes("user rejected") || msg.includes("denied"))
            friendly = "Transaction cancelled in wallet.";
          else if (msg.includes("operator approval") || msg.includes("erc1155"))
            friendly =
              "Outcome-token approval is still pending or missing. Wait a few seconds after approving, then try again.";
          else if (msg.includes("insufficient") || msg.includes("maximum sell amount exceeded"))
            friendly = "Insufficient balance or slippage. Try a smaller amount.";
          else if (msg.includes("revert"))
            friendly = "Transaction reverted. Try a smaller amount or try again.";
          setBuyFeedback(friendly);
          setTradeFeedback(null);
          setTradeInProgress(false);
          setTimeout(() => setBuyFeedback(null), 8000);
        },
        onSuccess: async (result: unknown) => {
          setBuyFeedback("Trade Submitted");
          // Record trade to DB (best-effort, don't block UX)
          try {
            if (account?.address) {
              const proceeds = Number(returnAmount) / CASH_TOKEN_SCALE;
              const tsb =
                typeof tokensToSellBig === "bigint" ? tokensToSellBig : BigInt(String(tokensToSellBig));
              const tokensSoldHuman = bigintWeiToHumanNumber(tsb, outcomeTokenDecimals);
              const avgPrice = tokensSoldHuman > 0 ? proceeds / tokensSoldHuman : 0;
              await submitTrade({
                walletAddress: account.address,
                marketTitle: market.title,
                marketId: market.id,
                outcome: selectedOutcome === "yes" ? "Yes" : "No",
                shares: tokensSoldHuman,
                avgPrice,
                betAmount: proceeds,
                toWin: 0,
                status: "OPEN",
                txHash: txHashFromResult(result),
                tradeType: "SELL",
              });
            }
          } catch (err) {
            console.error("Failed to submit FPMM sell trade to DB:", err);
          }
          await waitForTransactionConfirmation(result, "Trade Completed");
          recordNewOdds();
          setTradeFeedback(null);
        },
        onSettled: () => {},
      });
    } catch (e) {
      console.error("FPMM sell error:", e);
      setBuyFeedback("Trade failed. Check your input and try again.");
      setTradeFeedback(null);
      setTradeInProgress(false);
      setTimeout(() => setBuyFeedback(null), 4000);
    }
  };

  const handleSellAllClick = useCallback(async () => {
    if (mode !== "sell" || !selectedOutcome) return;
    const ownedSharesHuman =
      selectedOutcome === "yes"
        ? outcome1Balance !== "--" && outcome1Balance !== "Error"
          ? parseFloat(outcome1Balance)
          : 0
        : outcome2Balance !== "--" && outcome2Balance !== "Error"
          ? parseFloat(outcome2Balance)
          : 0;
    const ownedSharesWei = BigInt(Math.floor(Math.max(0, ownedSharesHuman) * outcomeScale));
    const outcomeIndex: 0 | 1 = selectedOutcome === "yes" ? 0 : 1;
    if (ownedSharesWei <= 0n) {
      setBuyFeedback("No shares available to sell for the selected outcome.");
      setTimeout(() => setBuyFeedback(null), 4000);
      return;
    }
    try {
      setBuyFeedback("Quoting Sell All...");
      const pool = await getOutcomePoolBalancesWei(
        conditionalTokensContract,
        marketContract.address,
        outcome1PositionId,
        outcome2PositionId
      );
      const outWei = quoteCollateralOutWeiForSellAll(pool, ownedSharesWei, outcomeIndex, 0n);
      const outHuman = bigintWeiToHumanNumber(outWei, outcomeTokenDecimals);
      const adjusted = Math.max(0, outHuman - 0.01);
      setAmount(Number.isFinite(adjusted) ? adjusted.toFixed(2) : "");
    } catch (e) {
      console.error("Sell All quote failed:", e);
      setBuyFeedback("Could not quote Sell All. Please try again.");
      setTimeout(() => setBuyFeedback(null), 5000);
    } finally {
      setBuyFeedback(null);
    }
  }, [
    mode,
    selectedOutcome,
    outcome1Balance,
    outcome2Balance,
    conditionalTokensContract,
    marketContract.address,
    outcome1PositionId,
    outcome2PositionId,
    outcomeTokenDecimals,
  ]);

  // Wrap recordNewOdds in useCallback
  const recordNewOdds = useCallback(async () => {
    try {
      // Wait a bit for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      const [sharesYes, sharesNo] = await Promise.all([
        readContract({
          contract: marketContract,
          method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
          params: [INVESTMENT_AMOUNT, 0n],
        }),
        readContract({
          contract: marketContract,
          method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
          params: [INVESTMENT_AMOUNT, 1n],
        }),
      ]);
      const invHuman = bigintWeiToHumanNumber(INVESTMENT_AMOUNT, CASH_TOKEN_DECIMALS);
      const sY = bigintWeiToHumanNumber(
        typeof sharesYes === "bigint" ? sharesYes : BigInt(String(sharesYes)),
        outcomeTokenDecimals
      );
      const sN = bigintWeiToHumanNumber(
        typeof sharesNo === "bigint" ? sharesNo : BigInt(String(sharesNo)),
        outcomeTokenDecimals
      );
      const oddsYesRaw = sY > 0 ? invHuman / sY : 0;
      const oddsNoRaw = sN > 0 ? invHuman / sN : 0;
      const sum = oddsYesRaw + oddsNoRaw;
      const pY = sum > 0 ? oddsYesRaw / sum : 0;
      const pN = sum > 0 ? oddsNoRaw / sum : 0;
      const yesProbability = pY * 2 ** 64;
      const noProbability = pN * 2 ** 64;
      console.log("FPMM odds (after delay):", { sharesYes: sharesYes.toString(), sharesNo: sharesNo.toString(), probYes: pY, probNo: pN });
      // Record to database (after trade, odds should have changed)
      const oddsResponse = await fetch(`${API_BASE_URL}/api/record-odds`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
          // No API key needed - handled server-side
        },
        body: JSON.stringify({
          marketId: market.id,
          yesProbability,
          noProbability,
          timestamp: new Date().toISOString()
        }),
      });
      if (!oddsResponse.ok) {
        console.error('Failed to record odds to database:', oddsResponse.status, oddsResponse.statusText);
      } else {
        console.log('Recorded new odds to database after trade:', { yesProbability, noProbability });
      }
      // Refresh the odds history to show the new entry (chart)
      try {
        await fetchOddsHistory();
      } catch (error) {
        console.error('Failed to refresh odds history:', error);
      }
      // Refetch live odds so Market Odds header and Yes/No buttons update
      refetchOddsFromContract();
    } catch (error) {
      console.error('Failed to record odds:', error);
    }
  }, [marketContract, market.id, fetchOddsHistory, refetchOddsFromContract, outcomeTokenDecimals]);

  const chartGridStroke = themeResolved === "dark" ? "#52525b" : "#bdbdbd";
  const chartTickFill = themeResolved === "dark" ? "#94a3b8" : "#525252";
  const chartLineYes = themeResolved === "dark" ? "#00e889" : "#22c55e";
  const chartLineNo = themeResolved === "dark" ? "#3b82f6" : "#2563eb";

  /** Show Submit row while entering a trade, during settlement, or while success label is shown on button */
  const showFpmmTradeAction =
    !!selectedOutcome &&
    (!!successMessage || !!postTradeQuoteSnapshot || (!!amount && !Number.isNaN(Number(amount))));

  const fpmmSubmitDisabled =
    !!successMessage ||
    !!tradeInProgress ||
    !selectedOutcome ||
    (!successMessage && (!amount || Number.isNaN(Number(amount)))) ||
    (mode === "buy" && tradeStatus === "pending") ||
    (mode === "sell" && (sellEstSharesLoading || sellEstSharesDisplay === "--")) ||
    (selectedOutcome === "yes" && mode === "sell" && buyYesStatus === "pending") ||
    (selectedOutcome === "no" && mode === "sell" && buyNoStatus === "pending");

  // ---- Presentation only below: everything is read from the state and handlers above ----

  // Phones open the trade panel in a sheet from the bottom bar; the sheet is mounted only below lg.
  const [tradeOpen, setTradeOpen] = useState(false);
  const [evidenceFormOpen, setEvidenceFormOpen] = useState(false);
  const tradeInline = useIsDesktop("(min-width: 1024px)");
  const evidenceSheetRef = useRef<HTMLDivElement>(null);

  // As in the original's Cash line: '$--' signed out, '$0' with no balance, otherwise the formatted balance.
  const cashText = !account?.address
    ? '$--'
    : (() => {
        if (!userTokenBalance) return '$0';
        const amount = Number(userTokenBalance) / CASH_TOKEN_SCALE;
        const formatted =
          amount % 1 === 0
            ? amount.toLocaleString(undefined, { maximumFractionDigits: 0 })
            : amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
        return `$${formatted}`;
      })();

  const yesPct = typeof oddsYes === 'bigint' && typeof oddsNo === 'bigint' ? Math.round(Number(oddsYes) / Math.pow(2, 64) * 100) : null;
  const noPct = typeof oddsYes === 'bigint' && typeof oddsNo === 'bigint' ? Math.round(Number(oddsNo) / Math.pow(2, 64) * 100) : null;
  const chartRange =
    chartData.length > 0
      ? [chartData[0].timestamp, chartData[chartData.length - 1].timestamp]
          .map((t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }))
          .join(" — ")
      : null;

  const tradePanelProps: TradePanelProps = {
    showTradingUi: showFpmmTradingUi,
    oddsLoading: fpmmOddsLoading,
    devTradingBanner: tradingResolved && forceFpmmDevTrading,
    mode,
    onModeChange: (m) => {
      dismissTradeSuccess();
      setMode(m);
      setAmount("");
      setSelectedOutcome(null);
    },
    selectedOutcome,
    onSelectOutcome: (o) => {
      dismissTradeSuccess();
      setSelectedOutcome(o);
    },
    amount,
    onAmountChange: (raw) => {
      dismissTradeSuccess();
      setAmount(raw);
    },
    oddsYes,
    oddsNo,
    cashText,
    yesSharesText: formatOutcomeSharesCell(isBalanceLoading, outcome1Balance),
    noSharesText: formatOutcomeSharesCell(isBalanceLoading, outcome2Balance),
    yesPending: buyYesStatus === 'pending',
    noPending: buyNoStatus === 'pending',
    buyEstShares: buyEstSharesDisplay,
    buyEstLoading: buyEstSharesLoading,
    sellEstShares: sellEstSharesDisplay,
    sellEstLoading: sellEstSharesLoading,
    payoutDisplay,
    avgPriceDisplay,
    successMessage,
    snapshot: postTradeQuoteSnapshot,
    showAction: showFpmmTradeAction,
    tradeInProgress,
    tradePending: tradeStatus === "pending",
    submitDisabled: fpmmSubmitDisabled,
    onSubmit: () => {
      if (!selectedOutcome || !amount || successMessage) return;
      if (mode === 'buy') {
        handleFpmmBuy(amount);
      } else {
        handleFpmmSell(amount);
      }
    },
    onSellAll: handleSellAllClick,
    redeem: {
      conditionalTokensContract,
      defaults: redeemDefaults,
      onStart: handleRedeemStart,
      onSuccess: handleRedeemSuccess,
      successMessage: redeemSuccessMessage,
    },
  };

  const mobileSide: "yes" | "no" = evidenceTabIndex === 1 ? "no" : "yes";

  return (
    <div className="pb-32 lg:pb-0">
      <Navbar variant={isEmbed ? "embed" : "full"} />

      <div className="container-page pb-24 pt-7 md:pt-9">
        {/* An article, with the trade box beside it on desktop for the length of the page */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0">
            <h1 id="case-title" className="serif text-[40px] font-medium leading-none tracking-[-0.02em] text-ink [text-wrap:pretty] md:text-[58px]">
              <span className="line-mask">
                <span>{market.title}</span>
              </span>
            </h1>
            {market.description && (
              <p className="after-lines serif mt-3.5 max-w-[46ch] text-[19px] leading-[1.4] text-ink-2 md:text-[21px]">{market.description}</p>
            )}

            {/* Market Odds: the two prices on one quiet line, the price history under it */}
            <section aria-labelledby="odds-heading" className="mt-7" data-reveal>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule pb-2">
                <h2 id="odds-heading" className="serif text-[20px] font-medium text-ink">
                  Market Odds
                </h2>
                <ProbabilityBar yesPct={yesPct} noPct={noPct} loading={fpmmOddsLoading} />
              </div>
              <div className="mt-3">
                {loadingOdds ? (
                  <div className="skeleton h-[240px] w-full">
                    <span className="sr-only">Loading chart...</span>
                  </div>
                ) : (
                  <div data-ui>
                    <OddsChart data={chartData} height={240} />
                  </div>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-small text-muted">
                  {!loadingOdds && (
                    <>
                      <span aria-hidden className="inline-flex items-center gap-1.5">
                        <i className="inline-block h-[2px] w-[18px] bg-yes" />
                        Yes
                      </span>
                      <span aria-hidden className="inline-flex items-center gap-1.5">
                        <i className="inline-block h-[2px] w-[18px] bg-no" />
                        No
                      </span>
                    </>
                  )}
                  {chartRange && <span className="num ml-auto">{chartRange}</span>}
                </div>
              </div>
            </section>

            {/* As on the original: the first sentence while closed, every paragraph when open */}
            <section aria-labelledby="rules-heading" className="mt-10" data-reveal>
              <h2 id="rules-heading" className="serif border-b border-rule pb-2 text-[20px] font-medium text-ink">
                Rules
              </h2>
              <AutoHeight className="mt-3">
                <div className="market-rules serif flex max-w-[68ch] flex-col gap-4 text-[17px] leading-[1.6] text-ink-2 md:text-[19px]">
                  {splitRules(showRules ? rulesFull : firstLine).map((para, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: para }} />
                  ))}
                </div>
              </AutoHeight>
              <button
                type="button"
                onClick={() => setShowRules((prev) => !prev)}
                aria-expanded={showRules}
                className="touch mt-3 inline-flex items-center gap-1.5 border-b border-rule-2 pb-px text-small text-ink transition-colors duration-200 hover:border-ink"
              >
                {showRules ? "Read Less" : "Read More"}
                <CaretDown size={12} className={`transition-transform duration-200 ease-out-quart ${showRules ? "rotate-180" : ""}`} aria-hidden />
              </button>
            </section>

            {/* Evidence: the two sides as columns */}
            <section aria-labelledby="evidence-heading" className="mt-10">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-rule pb-2" data-reveal>
                <h2 id="evidence-heading" className="serif text-[20px] font-medium text-ink">
                  Evidence
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="num text-[12px] text-muted">
                    Yes Power: {yesVotingPower}x | No Power: {noVotingPower}x
                  </p>
                  <button type="button" onClick={() => setEvidenceFormOpen(true)} className="btn btn-outline btn-sm">
                    Submit Document
                  </button>
                </div>
              </div>
              <CaseColumns
                labels={market.outcomes}
                yesItems={sortedYesEvidence}
                noItems={sortedNoEvidence}
                showAllYes={showAllYes}
                onToggleYes={() => setShowAllYes(v => !v)}
                showAllNo={showAllNo}
                onToggleNo={() => setShowAllNo(v => !v)}
                userVotes={userVotes}
                votingId={votingEvidenceId}
                contribution={getUserVotingContribution}
                onVote={handleVote}
                mobileSide={mobileSide}
                onMobileSideChange={(s) => setEvidenceTabIndex(s === "no" ? 1 : 0)}
              />
            </section>
          </article>

          {/* Desktop vs phone is decided by CSS so the first paint already has the right layout */}
          <aside className="hidden lg:block" aria-label="Trade">
            <div ref={fpmmTradingPanelRefDesktop} className="sticky top-16 border border-ink p-5">
              <TradePanel {...tradePanelProps} />
            </div>
          </aside>
        </div>
      </div>

      <TradeBar
        oddsYes={oddsYes}
        oddsNo={oddsNo}
        oddsLoading={fpmmOddsLoading}
        onPick={(side) => {
          dismissTradeSuccess();
          setSelectedOutcome(side);
          setTradeOpen(true);
        }}
      />
      {!tradeInline && (
        <TradeSheet open={tradeOpen} onClose={() => setTradeOpen(false)} title={market.title} panelRef={fpmmTradingPanelRefMobile}>
          <TradePanel {...tradePanelProps} />
        </TradeSheet>
      )}

      <TradeSheet open={evidenceFormOpen} onClose={() => setEvidenceFormOpen(false)} title="Submit Document" panelRef={evidenceSheetRef}>
        <EvidenceForm
          side={evidenceType}
          onSideChange={setEvidenceType}
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          url={url}
          onUrlChange={setUrl}
          uploadType={uploadType}
          onUploadTypeChange={(t) => {
            if (t === 'url') {
              setUploadType('url');
              setSelectedFile(null);
            } else {
              setUploadType('pdf');
              setUrl('');
            }
          }}
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          isUploading={isUploading}
          message={evidenceSuccessMessage}
          onSubmit={handleSubmitDocument}
        />
      </TradeSheet>

      {showWalletError && (
        <Dialog
          title="Wallet Required"
          body="Please connect a wallet to begin trading. Click connect button in the top right and sign-in using any account."
        >
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowWalletError(false)}>
            OK
          </button>
        </Dialog>
      )}

      {showSignInModal && (
        <Dialog title="Sign In Required" body="Please sign in to upvote or downvote information">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSignInModal(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowSignInModal(false);
              // Scroll to and focus the ConnectButton in the Navbar
              setTimeout(() => {
                // main matched the masthead button by its black background class; the restyled button
                // is also matched by thirdweb's own data-test attribute.
                const connectButton = document.querySelector('[data-testid="connect-button"], button[class*="bg-black"], [data-test="connect-wallet-button"]') as HTMLElement;
                if (connectButton) {
                  connectButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  connectButton.focus();
                  // Trigger click after a short delay to ensure it's visible
                  setTimeout(() => {
                    connectButton.click();
                  }, 500);
                }
              }, 100);
            }}
          >
            Sign In
          </button>
        </Dialog>
      )}
    </div>
  );
}

export default function MarketPage(props: { params: Promise<{ marketId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10">
          <SkeletonLines rows={3} />
        </div>
      }
    >
      <MarketPageContent {...props} />
    </Suspense>
  );
}
