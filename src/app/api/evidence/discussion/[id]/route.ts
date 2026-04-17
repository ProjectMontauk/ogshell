import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAllowedOrigin } from '../../../../../../lib/cors';

const prisma = new PrismaClient();

function corsHeaders(origin: string | undefined) {
  const allowed = getAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {}),
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 200, headers: corsHeaders(origin) });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin') ?? undefined;
  const h = corsHeaders(origin);

  try {
    const { id } = await params;
    const evidenceId = parseInt(id);
    
    if (isNaN(evidenceId)) {
      return NextResponse.json({ error: 'Invalid evidence ID' }, { status: 400, headers: h });
    }

    const evidence = await prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404, headers: h });
    }

    return NextResponse.json(evidence, { headers: h });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: h });
  }
} 