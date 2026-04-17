import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { getAllowedOrigin } from '../../../../lib/cors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

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
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400, headers: h }
      );
    }

    console.log('🔍 Checking session status for:', sessionId);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('📊 Session details:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      metadata: session.metadata
    });

    // Check if this session has already been processed in the database
    const existingSession = await prisma.processedSession.findUnique({
      where: { sessionId: sessionId }
    });
    
    if (existingSession) {
      console.log('✅ Session already processed for minting:', existingSession);
      return NextResponse.json({
        alreadyProcessed: true,
        session: {
          id: session.id,
          status: session.status,
          payment_status: session.payment_status,
          metadata: session.metadata
        },
        processedAt: existingSession.mintedAt,
        status: existingSession.status
      }, { headers: h });
    }

    // Check if the session is completed and has metadata
    const isCompleted = session.status === 'complete' && session.payment_status === 'paid';
    const hasMetadata = session.metadata && session.metadata.nashAmount && session.metadata.customerWallet;
    
    if (isCompleted && hasMetadata) {
      console.log('🆕 Session ready for processing');
      return NextResponse.json({
        alreadyProcessed: false,
        ready: true,
        session: {
          id: session.id,
          status: session.status,
          payment_status: session.payment_status,
          metadata: session.metadata
        }
      }, { headers: h });
    } else {
      console.log('❌ Session not ready for processing');
      return NextResponse.json({
        alreadyProcessed: false,
        ready: false,
        session: {
          id: session.id,
          status: session.status,
          payment_status: session.payment_status,
          metadata: session.metadata
        }
      }, { headers: h });
    }

  } catch (error: unknown) {
    console.error('Error checking session status:', error);
    
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Failed to check session status';
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode, headers: h }
    );
  } finally {
    await prisma.$disconnect();
  }
}
