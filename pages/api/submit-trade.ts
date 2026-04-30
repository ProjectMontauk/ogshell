import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, type Prisma } from '@prisma/client';
import { getAllowedOrigin } from '../../lib/cors';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = getAllowedOrigin(req.headers.origin as string | undefined);
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('Submit Trade API called with method:', req.method);
    console.log('Submit Trade API request headers:', req.headers);
    console.log('Submit Trade API request body:', req.body);
    
    const {
      walletAddress,
      marketTitle,
      marketId,
      outcome,
      shares,
      avgPrice,
      betAmount,
      toWin,
      status,
      txHash,
      tradeType,
    } = req.body;
    
    // Validate required fields (don't treat numeric 0 as "missing")
    if (!walletAddress || !marketTitle || !marketId || !outcome) {
      console.error('Missing required string fields:', { walletAddress, marketTitle, marketId, outcome });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (shares === null || shares === undefined || Number(shares) <= 0 || !Number.isFinite(Number(shares))) {
      console.error('Invalid shares:', { shares });
      return res.status(400).json({ error: 'Invalid shares' });
    }
    if (avgPrice === null || avgPrice === undefined || !Number.isFinite(Number(avgPrice))) {
      console.error('Invalid avgPrice:', { avgPrice });
      return res.status(400).json({ error: 'Invalid avgPrice' });
    }
    if (betAmount === null || betAmount === undefined || !Number.isFinite(Number(betAmount))) {
      console.error('Invalid betAmount:', { betAmount });
      return res.status(400).json({ error: 'Invalid betAmount' });
    }
    if (toWin === null || toWin === undefined || !Number.isFinite(Number(toWin))) {
      console.error('Invalid toWin:', { toWin });
      return res.status(400).json({ error: 'Invalid toWin' });
    }
    
    console.log('Creating trade with data:', {
      walletAddress,
      marketTitle,
      marketId,
      outcome,
      shares,
      avgPrice,
      betAmount,
      toWin,
      status: status || 'OPEN',
    });
    
    // Create the trade record
    const data: Prisma.TradeCreateInput = {
      walletAddress,
      marketTitle,
      marketId: marketId as string,
      outcome,
      shares: Number(shares),
      avgPrice: Number(avgPrice),
      betAmount: Number(betAmount),
      toWin: Number(toWin),
      status: status || 'OPEN',
      txHash: typeof txHash === 'string' && txHash.trim() ? txHash.trim() : undefined,
      tradeType:
        typeof tradeType === 'string' && tradeType.trim()
          ? tradeType.trim()
          : undefined,
    };

    const trade = await prisma.trade.create({ data });
    
    console.log('Trade created successfully:', trade);
    
    // Return success response
    res.status(201).json({
      success: true,
      data: trade
    });

  } catch (error) {
    console.error('Error in submit-trade API:', error);
    console.error('Request body:', req.body);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    res.status(500).json({ 
      error: 'Failed to create trade',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}