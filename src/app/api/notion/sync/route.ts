import { NextRequest, NextResponse } from 'next/server';
import { createExpense } from '../../../../lib/notion';

// Rate limiting setup
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

const requestCounts = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const requestInfo = requestCounts.get(identifier);

  if (!requestInfo) {
    requestCounts.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  if (now - requestInfo.timestamp > RATE_LIMIT_WINDOW) {
    requestCounts.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  if (requestInfo.count >= MAX_REQUESTS) {
    return true;
  }

  requestInfo.count++;
  return false;
}

export async function POST(request: NextRequest) {
  // Get IP from headers or forwarded headers
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const expense = await request.json();
    await createExpense(expense);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing to Notion:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Notion' },
      { status: 500 }
    );
  }
}
