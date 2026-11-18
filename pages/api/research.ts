import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

/**
 * GET /api/research?marketId=<id>&limit=<n>
 * Automated (LLM-driven) agent trades with the evaluation behind each one, newest first.
 * Powers the Research tab.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const marketId = typeof req.query.marketId === 'string' && req.query.marketId ? req.query.marketId : undefined;
    const limitParam = Number(req.query.limit);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 500) : 200;

    const rows = await prisma.agentResearch.findMany({
      where: marketId ? { marketId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching agent research:', error);
    return res.status(500).json({ error: 'Failed to fetch research' });
  }
}
