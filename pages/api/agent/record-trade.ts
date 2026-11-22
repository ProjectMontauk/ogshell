import type { NextApiRequest, NextApiResponse } from 'next';
import { readContract } from 'thirdweb';
import { isTrustedCaller } from '../../../lib/automation';
import prisma from '../../../lib/prisma';
import { getContractsForMarket } from '../../../constants/contracts';
import { CASH_TOKEN_DECIMALS } from '../../../constants/tokenUnits';
import { getMarketById } from '../../../src/data/markets';

/**
 * POST /api/agent/record-trade
 *
 * One call that records an agent's (already executed, on-chain) trade in the app:
 *   1. Trade row (trade history)
 *   2. OddsHistory point (odds chart) from live calcBuyAmount quotes
 *   3. UserMarketPosition from the wallet's current Conditional Tokens balances
 *   4. AgentResearch row (the "Research" tab), only when `research` is supplied, i.e. for LLM-driven trades
 *
 * Body: { walletAddress, marketId, side: 'yes' | 'no', usd, shares, txHash?, tradeType?: 'BUY' | 'SELL',
 *         research?: { agentProbability, marketYesPrice, edge, confidence, reasoning, model? } }
 * Idempotent on txHash (when provided): re-posting the same txHash returns the existing trade.
 *
 * Requires `Authorization: Bearer $AGENT_API_SECRET`: this route writes trades, odds and positions for any wallet.
 */

const ODDS_SCALE = 2 ** 64; // OddsHistory stores probability * 2^64, like the app does
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  if (!isTrustedCaller(req)) return res.status(401).json({ error: 'Missing or wrong AGENT_API_SECRET' });

  try {
    const { walletAddress, marketId, side, usd, shares, txHash } = req.body ?? {};
    const tradeType = String(req.body?.tradeType ?? 'BUY').toUpperCase();

    const market = typeof marketId === 'string' ? getMarketById(marketId) : undefined;
    if (!market) return res.status(400).json({ error: `Unknown marketId "${marketId}"` });
    if (typeof walletAddress !== 'string' || !ADDRESS_RE.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid walletAddress' });
    }
    const sideNorm = String(side ?? '').toLowerCase();
    if (sideNorm !== 'yes' && sideNorm !== 'no') {
      return res.status(400).json({ error: 'side must be "yes" or "no"' });
    }
    if (tradeType !== 'BUY' && tradeType !== 'SELL') {
      return res.status(400).json({ error: 'tradeType must be BUY or SELL' });
    }
    const usdNum = Number(usd);
    const sharesNum = Number(shares);
    if (!Number.isFinite(usdNum) || usdNum <= 0) return res.status(400).json({ error: 'Invalid usd' });
    if (!Number.isFinite(sharesNum) || sharesNum <= 0) return res.status(400).json({ error: 'Invalid shares' });
    // txHash is optional (the agent may not have it if its relayer was slow), but if given it must be valid.
    const hash = typeof txHash === 'string' ? txHash.trim() : '';
    if (hash && !/^0x[a-fA-F0-9]{64}$/.test(hash)) return res.status(400).json({ error: 'Invalid txHash' });

    // Optional LLM context for the Research tab.
    let research: {
      agentProbability: number;
      marketYesPrice: number;
      edge: number;
      confidence: string;
      reasoning: string;
      model: string | null;
    } | null = null;
    if (req.body?.research !== undefined && req.body.research !== null) {
      const r = req.body.research;
      const agentProbability = Number(r.agentProbability);
      const marketYesPrice = Number(r.marketYesPrice);
      const edge = Number(r.edge);
      if (![agentProbability, marketYesPrice, edge].every(Number.isFinite)) {
        return res.status(400).json({ error: 'research needs numeric agentProbability, marketYesPrice and edge' });
      }
      research = {
        agentProbability,
        marketYesPrice,
        edge,
        confidence: ['low', 'medium', 'high'].includes(String(r.confidence)) ? String(r.confidence) : 'low',
        reasoning: String(r.reasoning ?? '').slice(0, 2000),
        model: typeof r.model === 'string' && r.model.trim() ? r.model.trim().slice(0, 100) : null,
      };
    }

    // Idempotency: don't double-record the same transaction.
    if (hash) {
      const existing = await prisma.trade.findFirst({ where: { txHash: hash } });
      if (existing) return res.status(200).json({ success: true, alreadyRecorded: true, trade: existing });
    }

    // ---- read live state from the chain (quotes + balances) ----
    const { marketContract, conditionalTokensContract, outcome1PositionId, outcome2PositionId, outcomeTokenDecimals } =
      getContractsForMarket(marketId);

    const oneDollar = BigInt(10) ** BigInt(CASH_TOKEN_DECIMALS);
    const [yesQuote, noQuote, yesRaw, noRaw] = await Promise.all([
      readContract({
        contract: marketContract,
        method: 'function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)',
        params: [oneDollar, BigInt(0)],
      }),
      readContract({
        contract: marketContract,
        method: 'function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)',
        params: [oneDollar, BigInt(1)],
      }),
      readContract({
        contract: conditionalTokensContract,
        method: 'function balanceOf(address account, uint256 id) view returns (uint256)',
        params: [walletAddress, BigInt(outcome1PositionId)],
      }),
      readContract({
        contract: conditionalTokensContract,
        method: 'function balanceOf(address account, uint256 id) view returns (uint256)',
        params: [walletAddress, BigInt(outcome2PositionId)],
      }),
    ]);

    const outDiv = 10 ** outcomeTokenDecimals;
    const sharesPerDollarYes = Number(yesQuote) / outDiv;
    const sharesPerDollarNo = Number(noQuote) / outDiv;
    const oddsPoint =
      sharesPerDollarYes > 0 && sharesPerDollarNo > 0
        ? (() => {
            const oy = 1 / sharesPerDollarYes;
            const on = 1 / sharesPerDollarNo;
            return { yes: oy / (oy + on), no: on / (oy + on) };
          })()
        : null;

    const yesShares = Math.floor(Number(yesRaw) / outDiv);
    const noShares = Math.floor(Number(noRaw) / outDiv);

    // ---- write everything together (all rows or none) ----
    const result = await prisma.$transaction(async (tx) => {
      const trade = await tx.trade.create({
        data: {
          walletAddress,
          marketTitle: market.title,
          marketId,
          outcome: sideNorm === 'yes' ? 'Yes' : 'No',
          shares: sharesNum,
          avgPrice: usdNum / sharesNum,
          betAmount: usdNum,
          toWin: tradeType === 'BUY' ? sharesNum - usdNum : 0,
          status: 'OPEN',
          txHash: hash || undefined,
          tradeType,
        },
      });
      const odds = oddsPoint
        ? await tx.oddsHistory.create({
            data: {
              marketId,
              yesProbability: Math.round(oddsPoint.yes * ODDS_SCALE),
              noProbability: Math.round(oddsPoint.no * ODDS_SCALE),
              timestamp: new Date(),
            },
          })
        : null;
      const position = await tx.userMarketPosition.upsert({
        where: { marketId_walletAddress: { marketId, walletAddress } },
        update: { yesShares, noShares },
        create: { marketId, walletAddress, yesShares, noShares },
      });
      const researchRow = research
        ? await tx.agentResearch.create({
            data: {
              walletAddress,
              marketId,
              marketTitle: market.title,
              action: tradeType,
              outcome: sideNorm === 'yes' ? 'Yes' : 'No',
              shares: sharesNum,
              amountUsd: usdNum,
              avgPrice: usdNum / sharesNum,
              txHash: hash || undefined,
              ...research,
            },
          })
        : null;
      return { trade, odds, position, researchRow };
    });

    return res.status(201).json({
      success: true,
      trade: result.trade,
      odds: oddsPoint ?? null,
      oddsRecorded: Boolean(result.odds),
      position: result.position,
      researchRecorded: Boolean(result.researchRow),
    });
  } catch (error) {
    console.error('agent/record-trade failed:', error);
    return res.status(500).json({
      error: 'Failed to record trade',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
