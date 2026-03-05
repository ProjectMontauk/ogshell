import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAllowedOrigin } from '../../../lib/cors';

function corsHeaders(origin: string | undefined) {
  const allowed = getAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {}),
  };
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(origin),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') ?? undefined;
  const headers = corsHeaders(origin);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const marketId = formData.get('marketId') as string;
    const evidenceType = formData.get('evidenceType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400, headers });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400, headers });
    }

    // Validate file size (max 10MB for direct blob upload)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400, headers });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${marketId}_${evidenceType}_${timestamp}_${file.name}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Vercel Blob storage with larger timeout
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'application/pdf',
    });
    
    // Return the public URL for the uploaded file
    const fileUrl = blob.url;

    return NextResponse.json({ 
      success: true, 
      fileUrl,
      filename,
      originalName: file.name,
      size: file.size
    }, { headers });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' }, 
      { status: 500, headers }
    );
  }
}