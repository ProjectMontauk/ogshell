"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useReadContract } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { client } from "../../../src/client";
import { baseSepolia } from "thirdweb/chains";
import { getAllMarkets, Market } from "../../../src/data/markets";
import Navbar from "../../../components/Navbar";

const INVESTMENT_AMOUNT = BigInt("1000000000000000000"); // 1e18 for FPMM calcBuyAmount

// MarketCard component that fetches its own odds
const MarketCard = ({ market }: { market: Market }) => {
  const router = useRouter();
  const [fpmmProbs, setFpmmProbs] = useState<{ yes: number; no: number } | null>(null);

  // Create contract instance for this specific market
  const marketContractInstance = getContract({
    client,
    chain: baseSepolia,
    address: market.contractAddress,
  });

  // JFK uses FPMM: fetch odds via calcBuyAmount(1e18, outcomeIndex), then odds = investment/shares, normalized to probability
  const fetchFpmmOdds = useCallback(async () => {
    if (market.id !== "jfk") return;
    try {
      const [sharesYes, sharesNo] = await Promise.all([
        readContract({
          contract: marketContractInstance,
          method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
          params: [INVESTMENT_AMOUNT, 0n],
        }),
        readContract({
          contract: marketContractInstance,
          method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
          params: [INVESTMENT_AMOUNT, 1n],
        }),
      ]);
      const inv = Number(INVESTMENT_AMOUNT);
      const sY = Number(sharesYes);
      const sN = Number(sharesNo);
      if (sY <= 0 || sN <= 0) return;
      const oddsYesRaw = inv / sY;
      const oddsNoRaw = inv / sN;
      const probYes = oddsYesRaw / (oddsYesRaw + oddsNoRaw);
      const probNo = oddsNoRaw / (oddsYesRaw + oddsNoRaw);
      setFpmmProbs({ yes: probYes, no: probNo });
    } catch (e) {
      console.error("/markets FPMM odds error:", e);
      setFpmmProbs(null);
    }
  }, [market.id, marketContractInstance]);

  useEffect(() => {
    if (market.id === "jfk") fetchFpmmOdds();
  }, [market.id, fetchFpmmOdds]);

  // Fetch current marginal odds for Yes (0) and No (1) using calcMarginalPrice (non-FPMM markets)
  const { data: oddsYes } = useReadContract({
    contract: marketContractInstance,
    method: "function calcMarginalPrice(uint8 outcomeTokenIndex) view returns (uint256)",
    params: [0],
  });
  const { data: oddsNo } = useReadContract({
    contract: marketContractInstance,
    method: "function calcMarginalPrice(uint8 outcomeTokenIndex) view returns (uint256)",
    params: [1],
  });

  // Convert odds to probabilities: JFK uses FPMM-derived probs; others use calcMarginalPrice / 2^64
  const yesProbability =
    market.id === "jfk" && fpmmProbs
      ? fpmmProbs.yes
      : oddsYes !== undefined
        ? Number(oddsYes) / Math.pow(2, 64)
        : 0;
  const noProbability =
    market.id === "jfk" && fpmmProbs
      ? fpmmProbs.no
      : oddsNo !== undefined
        ? Number(oddsNo) / Math.pow(2, 64)
        : 0;

  return (
    <div
      className="bg-white rounded-xl shadow border border-gray-200 p-5 w-full sm:w-1/2 cursor-pointer hover:shadow-lg transition"
      onClick={() => router.push(`/markets/${market.id}`)}
      role="button"
      tabIndex={0}
      onKeyPress={e => { if (e.key === 'Enter') router.push(`/markets/${market.id}`); }}
    >
      <div className="mb-4">
        <Image
          src={market.image}
          alt={market.title}
          width={400}
          height={200}
          className="w-full h-48 rounded-lg object-cover object-top"
        />
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-bold text-gray-900">{market.title}</h3>
      </div>
      <div className="mb-0">
        <div className="grid grid-cols-4 gap-2 items-center">
          <div className="text-sm font-semibold text-black col-span-3">{market.outcomes[0]}:</div>
          <div className="text-lg font-bold text-green-600 text-right bg-green-100 rounded pr-7 px-1">
            {yesProbability > 0 ? `${Math.round(yesProbability * 100)}%` : '--'}
          </div>
          <div className="text-sm font-semibold text-black col-span-3">{market.outcomes[1]}:</div>
          <div className="text-lg font-bold text-red-600 text-right bg-red-100 rounded pr-7 px-1">
            {noProbability > 0 ? `${Math.round(noProbability * 100)}%` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketsContent = () => {
  const searchParams = useSearchParams();
  const category = searchParams?.get('category') || 'all';
  
  // Get all markets
  const allMarkets = getAllMarkets();
  
  // Filter markets based on category
  const getFilteredMarkets = () => {
    const historyMarkets = ['jfk'];
    const scienceMarkets = ['vaccine', 'string-theory', 'covid-vaccine'];
    
    switch (category) {
      case 'history':
        return allMarkets.filter(market => historyMarkets.includes(market.id));
      case 'science':
        return allMarkets.filter(market => scienceMarkets.includes(market.id));
      default:
        return allMarkets;
    }
  };
  
  const filteredMarkets = getFilteredMarkets();

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center w-full pt-8">
      {/* Title for each category */}
      <div className="w-full max-w-5xl mx-auto px-5">
        {category === 'history' && (
          <>
            <h1 className="text-[24px] font-bold text-[#171A22] mb-1">History Markets</h1>
          </>
        )}
        {category === 'science' && (
          <>
            <h1 className="text-[24px] font-bold text-[#171A22] mb-1">Science Markets</h1>
          </>
        )}
          </div>
      {/* Active Markets Section */}
      <div className="w-full flex flex-col items-center">
        <div className="flex flex-col gap-6 w-full max-w-5xl">
          {/* Display markets in rows of 2 */}
          {filteredMarkets.length > 0 ? (
            filteredMarkets.reduce((rows: Market[][], market: Market, index: number) => {
              if (index % 2 === 0) {
                rows.push([market]);
              } else {
                rows[rows.length - 1].push(market);
              }
              return rows;
            }, []).map((row: Market[], rowIndex: number) => (
              <div key={rowIndex} className="flex flex-col sm:flex-row gap-6 w-full">
                {row.map((market: Market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
                          </div>
                ))
          ) : (
            <div className="text-center text-gray-500 text-lg">
              No markets found for this category.
                      </div>
                          )}
                        </div>
                      </div>
      <div className="w-full h-8 bg-[#f8f9fa]"></div>
                    </div>
  );
};

const MarketsPage = () => {
  return (
                  <div>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">Loading markets...</div>}>
        <MarketsContent />
      </Suspense>
    </div>
  );
};

export default MarketsPage; 