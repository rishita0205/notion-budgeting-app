import { NextRequest, NextResponse } from 'next/server';
import { ExpenseItem } from '../../../types/expense';
import { extractTextFromImage } from '../../../lib/ocr/client';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    const result = await extractTextFromImage(image);
    console.log('🔍 Parsed expense in API:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze receipt' },
      { status: 500 }
    );
  }
}
