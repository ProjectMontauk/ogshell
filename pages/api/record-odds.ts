import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers based on environment
  const origin = req.headers.origin;
  const isDevelopment = process.env.NODE_ENV === 'development';

  const allowedOrigins = isDevelopment
    ? ['http://localhost:3000', 'https://localhost:3000']
    : ['https://www.thecitizen.io'];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { marketId, yesProbability, noProbability, timestamp } = req.body;

    // Validate required fields
    if (!marketId || typeof marketId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid marketId' });
    }

    if (yesProbability === undefined || noProbability === undefined) {
      return res.status(400).json({ error: 'Missing probability values' });
    }

    const yesNum = Number(yesProbability);
    const noNum = Number(noProbability);
    const ts = timestamp ? new Date(timestamp) : new Date();

    const entry = await prisma.oddsHistory.create({
      data: {
        marketId,
        yesProbability: yesNum,
        noProbability: noNum,
        timestamp: ts,
      },
    });

    console.log('Successfully recorded odds:', entry);
    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Error in record-odds API:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const details = error instanceof Error && error.cause ? String(error.cause) : undefined;
    res.status(500).json({
      error: 'Internal server error',
      details: message,
      ...(details && { cause: details }),
    });
  }
}
