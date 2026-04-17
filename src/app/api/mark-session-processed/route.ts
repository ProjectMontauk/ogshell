import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAllowedOrigin } from '../../../../lib/cors';

const prisma = new PrismaClient();

function corsHeaders(origin: string | undefined) {
  const allowed = getAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {}),
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 200, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  const h = corsHeaders(origin);

  try {
    const { sessionId, nashAmount, customerWallet, purchaseAmount, status = 'completed' } = await request.json();
    
    if (!sessionId || !nashAmount || !customerWallet || !purchaseAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, nashAmount, customerWallet, purchaseAmount' },
        { status: 400, headers: h }
      );
    }

    console.log('📝 Marking session as processed:', {
      sessionId,
      nashAmount,
      customerWallet,
      purchaseAmount,
      status
    });

    // Create or update the processed session record
    const processedSession = await prisma.processedSession.upsert({
      where: { sessionId: sessionId },
      update: {
        status: status,
        mintedAt: status === 'completed' ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        sessionId: sessionId,
        nashAmount: nashAmount,
        customerWallet: customerWallet,
        purchaseAmount: purchaseAmount,
        status: status,
        mintedAt: status === 'completed' ? new Date() : null
      }
    });

    console.log('✅ Session marked as processed:', processedSession);

    return NextResponse.json({
      success: true,
      processedSession: processedSession
    }, { headers: h });

  } catch (error: unknown) {
    console.error('Error marking session as processed:', error);
    
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Failed to mark session as processed';
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode, headers: h }
    );
  } finally {
    await prisma.$disconnect();
  }
}
