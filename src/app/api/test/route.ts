import { NextRequest, NextResponse } from 'next/server';
import { getAllowedOrigin } from '../../../../lib/cors';

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

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  const h = corsHeaders(origin);
  console.log('🧪 Test endpoint hit! Server is working.');
  return NextResponse.json(
    { message: 'Test endpoint working!', timestamp: new Date().toISOString() },
    { headers: h }
  );
}
