import { ExpenseItem, Category } from '../../types/expense';
import { format } from 'date-fns';

// Category keyword mappings
const categoryKeywords: Record<Category, string[]> = {
  transport: ['uber', 'ola', 'cab', 'auto', 'metro', 'bus', 'train', 'fuel', 'petrol', 'diesel'],
  'food&drink': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'coffee', 'tea', 'lunch', 'dinner'],
  entertainment: ['movie', 'netflix', 'spotify', 'amazon prime', 'theatre', 'concert'],
  housing: ['rent', 'maintenance', 'electricity', 'water', 'gas', 'internet'],
  groceries: ['bigbasket', 'grocery', 'kirana', 'supermarket', 'vegetables', 'fruits']
};

export function normalizeAmount(text: string): number {
  console.log('Parsing amount from text:', text);

  // Look for amounts with Rupee symbol (₹) or Yen symbol (¥) followed by digits and optional decimals
  const currencyPattern = /[₹¥](\d+(?:\.\d{2})?)/;
  let match = text.match(currencyPattern);

  // If not found, try looking for "Rs" or "INR" followed by amount
  if (!match) {
    const rsPattern = /(?:Rs\.?|INR)\s*(\d+(?:\.\d{2})?)/i;
    match = text.match(rsPattern);
  }

  if (match) {
    const amount = parseFloat(match[1]);
    console.log('Found amount with currency:', amount);
    return amount;
  }

  // Last resort: look for numbers followed by .00
  const decimalPattern = /(\d+)\.00\b/;
  match = text.match(decimalPattern);
  if (match) {
    const amount = parseFloat(match[1]);
    console.log('Found decimal amount:', amount);
    return amount;
  }

  return 0;
}

export function normalizeDate(text: string): string {
  const today = new Date();
  const currentYear = today.getFullYear();

  console.log('Parsing date from text:', text);

  // Month name to number mapping
  const monthMap: { [key: string]: number } = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };

  // Try to match format like "Aug 29 10:53PM"
  const primaryPattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+\d{1,2}:\d{2}(?:AM|PM)/i;
  const match = text.match(primaryPattern);

  if (match) {
    const monthStr = match[1].toLowerCase();
    const day = parseInt(match[2], 10);
    const month = monthMap[monthStr];

    console.log('Found date parts:', { month, day, year: currentYear });

    if (month && day && day >= 1 && day <= 31) {
      const date = new Date(currentYear, month - 1, day);
      return format(date, 'yyyy-MM-dd');
    }
  }

  // Default to today if no valid date found
  return format(today, 'yyyy-MM-dd');
}

export function detectMerchant(text: string): string {
  // Common merchant patterns (could be expanded)
  const merchantPatterns = [
    /(?:store|restaurant|shop):\s*([A-Za-z0-9\s&]+)/i,
    /([A-Za-z0-9\s&]+)\s+(?:pvt\.?\s+ltd\.?|limited)/i,
    /([A-Za-z0-9\s&]+)\s+receipt/i
  ];

  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return 'Unknown Merchant';
}

export function normalizeCategory(text: string): Category {
  const lowercaseText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowercaseText.includes(keyword))) {
      return category as Category;
    }
  }

  return 'food&drink'; // Default category
}

export function parseExpenseFromText(text: string): ExpenseItem {
  let expense = "Unknown expense";

  // Detect platform and format accordingly
  if (text.toLowerCase().includes('swiggy')) {
    expense = 'Swiggy order';
  } else if (text.toLowerCase().includes('zomato')) {
    expense = 'Zomato order';
  } else if (text.toLowerCase().includes('uber') ||
             text.toLowerCase().includes('ola') ||
             text.toLowerCase().includes('rapido') ||
             text.toLowerCase().includes('auto ride') ||
             text.toLowerCase().includes('cab ride')) {
    expense = 'Auto ride';
  }

  // Amount parsing - look specifically for bill total
  let amount = 0;
  const billTotalPattern = /Bill Total\s*[��¥]\s*(\d+(?:\.\d{2})?)/i;
  const billMatch = text.match(billTotalPattern);

  if (billMatch) {
    amount = parseFloat(billMatch[1]);
  } else {
    // Fallback: look for the last amount with currency symbol
    const amountPattern = /[₹¥]\s*(\d+(?:\.\d{2})?)/g;
    let lastAmount = 0;
    let match;
    while ((match = amountPattern.exec(text)) !== null) {
      lastAmount = parseFloat(match[1]);
    }
    amount = lastAmount;
  }

  // Date parsing with improved patterns
  const datePatterns = [
    // Look for time-stamped dates like "Aug 29 10:53PM"
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+\d{1,2}:\d{2}(?:AM|PM)/i,
    // Look for delivered/order dates
    /(?:delivered|order) on ([A-Za-z]+\s+\d{1,2})/i,
    // Generic date format
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i
  ];

  let extractedDate = '';
  const currentYear = new Date().getFullYear();

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let monthStr, dayStr;

      if (pattern.toString().includes('delivered|order')) {
        // Handle "delivered on Month Day" format
        const dateParts = match[1].trim().split(/\s+/);
        monthStr = dateParts[0];
        dayStr = dateParts[1];
      } else {
        // Handle standard "Month Day" format
        monthStr = match[1];
        dayStr = match[2];
      }

      const monthMap: { [key: string]: number } = {
        'jan': 1, 'january': 1,
        'feb': 2, 'february': 2,
        'mar': 3, 'march': 3,
        'apr': 4, 'april': 4,
        'may': 5,
        'jun': 6, 'june': 6,
        'jul': 7, 'july': 7,
        'aug': 8, 'august': 8,
        'sep': 9, 'september': 9,
        'oct': 10, 'october': 10,
        'nov': 11, 'november': 11,
        'dec': 12, 'december': 12
      };

      const month = monthMap[monthStr.toLowerCase()];
      const day = parseInt(dayStr, 10);

      if (month && day && day >= 1 && day <= 31) {
        extractedDate = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        break;
      }
    }
  }

  if (!extractedDate) {
    const now = new Date();
    extractedDate = now.toISOString().split('T')[0];
  }

  // Category detection based on expense type
  let category: Category = 'food&drink';
  if (expense.toLowerCase().includes('auto ride') ||
      expense.toLowerCase().includes('cab') ||
      expense.toLowerCase().includes('uber') ||
      expense.toLowerCase().includes('ola') ||
      expense.toLowerCase().includes('rapido')) {
    category = 'transport';
  }

  return {
    expense,
    amount,
    category,
    date: extractedDate,
    rawText: text
  };
}
