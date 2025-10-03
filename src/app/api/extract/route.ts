import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'OCR processing has been moved to client-side' },
    { status: 400 }
  );
}
