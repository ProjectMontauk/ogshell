import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getAllowedOrigin } from '../../lib/cors';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = getAllowedOrigin(req.headers.origin as string | undefined);
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Missing wallet address' });
    }

    // Get all deposits for the user
    const deposits = await prisma.userDeposits.findMany({
      where: {
        walletAddress: walletAddress,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate total deposits
    const totalDeposits = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);

    res.status(200).json({ 
      deposits,
      totalDeposits,
      depositCount: deposits.length
    });
  } catch (error) {
    console.error('Error fetching user deposits:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
} 