import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, amount, transactionHash } = req.body;

    if (!walletAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Record the deposit
    const deposit = await prisma.userDeposits.create({
      data: {
        walletAddress,
        amount: parseFloat(amount),
        transactionHash: transactionHash || null,
      },
    });

    res.status(200).json({ success: true, deposit });
  } catch (error) {
    console.error('Error tracking deposit:', error);
    res.status(500).json({ error: 'Failed to track deposit' });
  }
} 