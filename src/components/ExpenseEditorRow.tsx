import { ExpenseItem, Category, ExpenseWithStatus } from '../types/expense';
import { useState } from 'react';

interface ExpenseEditorRowProps {
  expense: ExpenseWithStatus;
  progress?: number;
  status?: string;
  onUpdate: (updatedExpense: ExpenseItem) => void;
  onSync: (expense: ExpenseItem) => void;
  onDelete: () => void;
  notionEnabled?: boolean;
}

const CATEGORIES: Category[] = ['entertainment', 'groceries', 'food&drink', 'housing', 'transport'];

export function ExpenseEditorRow({
  expense,
  progress = 0,
  status = '',
  onUpdate,
  onSync,
  onDelete,
  notionEnabled = false
}: ExpenseEditorRowProps) {
  const [showRawText, setShowRawText] = useState(false);

  const handleUpdate = (field: keyof ExpenseItem, value: string | number) => {
    onUpdate({
      ...expense,
      [field]: value,
    });
  };

  const progressBarColor =
    expense.status === 'error' ? 'bg-red-500' :
    expense.status === 'synced' ? 'bg-green-500' :
    'bg-blue-500';

  const statusText = status || {
    'pending': 'Waiting...',
    'extracted': notionEnabled ? 'Ready to sync' : 'Processed',
    'edited': 'Modified',
    'syncing': 'Syncing...',
    'synced': 'Synced',
    'error': expense.error || 'Error'
  }[expense.status];

  const isProcessing = progress > 0 && progress < 100;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {/* Progress bar */}
      {(progress > 0 || expense.status === 'syncing') && (
        <div className="h-1 w-full bg-gray-200 mb-4 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressBarColor} transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="space-y-4">
        {/* Status indicator */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{statusText}</span>
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="text-blue-500 hover:text-blue-600"
          >
            {showRawText ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* Raw text */}
        {showRawText && expense.rawText && (
          <pre className="bg-gray-50 p-4 rounded text-sm font-mono whitespace-pre-wrap">
            {expense.rawText}
          </pre>
        )}

        {/* Expense form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={expense.expense}
              onChange={(e) => handleUpdate('expense', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={expense.amount}
              onChange={(e) => handleUpdate('amount', parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={expense.date}
              onChange={(e) => handleUpdate('date', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={expense.category}
              onChange={(e) => handleUpdate('category', e.target.value as Category)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onDelete}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
          >
            Delete
          </button>

          {notionEnabled && expense.status !== 'synced' && (
            <button
              onClick={() => onSync(expense)}
              disabled={isProcessing || expense.status === 'syncing'}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {expense.status === 'syncing' ? 'Syncing...' : 'Send to Notion'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
