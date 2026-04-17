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
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing wallet address' });
    }

    // Check if a deposit already exists for this wallet
    const existingDeposit = await prisma.userDeposits.findFirst({
      where: {
        walletAddress: walletAddress,
      },
    });

    if (existingDeposit) {
      return res.status(400).json({ 
        error: 'Deposit already exists for this wallet',
        existingDeposit 
      });
    }

    // Create test deposit
    const deposit = await prisma.userDeposits.create({
      data: {
        walletAddress: walletAddress,
        amount: 100000, // 𐆖100,000 deposit
        transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000000", // Fake transaction hash
      },
    });

    res.status(200).json({ 
      success: true, 
      message: 'Test deposit of 𐆖100,000 added successfully',
      deposit 
    });
  } catch (error) {
    console.error('Error adding test deposit:', error);
    res.status(500).json({ error: 'Failed to add test deposit' });
  }
} 