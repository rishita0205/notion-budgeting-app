import { ExpenseItem } from '../../types/expense';

export async function analyzeReceiptWithAI(imageData: string): Promise<ExpenseItem> {
  console.log('🤖 Attempting to analyze receipt with AI...');

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze receipt');
    }

    const result = await response.json();
    console.log('✅ AI successfully analyzed receipt:', {
      expense: result.expense,
      amount: result.amount,
      category: result.category,
      merchant: result.merchant
    });

    return result;
  } catch (error) {
    console.error('❌ Error analyzing receipt with AI:', error);
    throw error;
  }
}
