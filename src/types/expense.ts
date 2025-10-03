export type Category = 'entertainment' | 'groceries' | 'food&drink' | 'housing' | 'transport';

export interface ExpenseItem {
  expense: string;      // e.g., "Swiggy order"
  amount: number;       // parsed number
  category: Category;   // normalized to one of the above
  date: string;        // ISO 8601 (YYYY-MM-DD) or date-time; we'll normalize to date
  sourceFile?: string; // filename for traceability
  rawText?: string;    // optional OCR text for review
  merchant?: string;   // name of the merchant/store/service provider
}

export interface ExpenseWithStatus extends ExpenseItem {
  status: 'pending' | 'extracted' | 'edited' | 'syncing' | 'synced' | 'error';
  error?: string;
  id: string; // Unique identifier for React keys
}
