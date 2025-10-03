'use client';

import { useState } from 'react';
import { FileDropzone } from '../components/FileDropzone';
import { ExpenseEditorRow } from '../components/ExpenseEditorRow';
import { Toaster, toast } from 'sonner';
import { ExpenseWithStatus, ExpenseItem } from '../types/expense';
// Client uploads images to server API for OCR and AI parsing
// import { extractTextFromImage, cleanupOCR } from '../lib/ocr/client';
import { config } from '../lib/config';

interface ProcessingStatus {
  progress: number;
  status: string;
}

export default function Home() {
  const [expenses, setExpenses] = useState<ExpenseWithStatus[]>([]);
  const [processingStatus, setProcessingStatus] = useState<Record<string, ProcessingStatus>>({});
  const isNotionConfigured = Boolean(config.NOTION_TOKEN && config.NOTION_DATABASE_ID);


  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const processFile = async (file: File): Promise<ExpenseItem> => {
    const fileName = file.name;
    try {
      setProcessingStatus(prev => ({
        ...prev,
        [fileName]: { progress: 0, status: 'Starting...' }
      }));

      // Convert File to base64 string
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix if present
          const base64 = result.includes('base64,')
            ? result.split('base64,')[1]
            : result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send image to server API for OCR and AI parsing
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64String })
      });
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
  const expense = await response.json() as ExpenseItem;
  console.log('⚙️ Parsed expense from server API:', expense);

      // Add source file information
      expense.sourceFile = fileName;

      // Clear processing status after successful completion
      setProcessingStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[fileName];
        return newStatus;
      });

      return expense;
    } catch (error) {
      console.error('Error processing file:', error);
      setProcessingStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[fileName];
        return newStatus;
      });
      throw error;
    }
  };

  const handleFilesAccepted = async (files: File[]) => {
    // Clear all processing status before starting new batch
    setProcessingStatus({});

    const BATCH_SIZE = 3;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (file) => {
          const uniqueId = generateUniqueId();
          const newExpense: ExpenseWithStatus = {
            expense: file.name,
            amount: 0,
            category: 'food&drink',
            date: new Date().toISOString().split('T')[0],
            sourceFile: file.name,
            id: uniqueId,
            status: 'pending'
          };

          setExpenses(prev => [...prev, newExpense]);

          try {
            const processedExpense = await processFile(file);

            setExpenses(prev =>
              prev.map(exp =>
                exp.id === uniqueId
                  ? { ...processedExpense, status: 'extracted', sourceFile: file.name, id: uniqueId }
                  : exp
              )
            );
          } catch (error) {
            setExpenses(prev =>
              prev.map(exp =>
                exp.id === uniqueId
                  ? { ...exp, status: 'error', error: 'Failed to extract data from image' }
                  : exp
              )
            );
            toast.error(`Failed to process ${file.name}`);
          }
        })
      );
    }
  };

  const handleExpenseUpdate = (sourceFile: string, updatedExpense: ExpenseItem) => {
    setExpenses(prev =>
      prev.map(exp =>
        exp.sourceFile === sourceFile
          ? { ...updatedExpense, status: 'edited', sourceFile, id: exp.id }
          : exp
      )
    );
  };

  const handleSync = async (expense: ExpenseWithStatus) => {
    if (!isNotionConfigured) {
      toast.error('Notion is not configured. Please set up Notion integration first.');
      return;
    }

    try {
      setExpenses(prev =>
        prev.map(exp =>
          exp.id === expense.id
            ? { ...exp, status: 'syncing' }
            : exp
        )
      );

      const response = await fetch('/api/notion/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        throw new Error('Failed to sync with Notion');
      }

      setExpenses(prev =>
        prev.map(exp =>
          exp.id === expense.id
            ? { ...exp, status: 'synced' }
            : exp
        )
      );

      toast.success('Successfully synced to Notion');
    } catch (error) {
      setExpenses(prev =>
        prev.map(exp =>
          exp.id === expense.id
            ? { ...exp, status: 'error', error: 'Failed to sync with Notion' }
            : exp
        )
      );
      toast.error('Failed to sync with Notion');
    }
  };

  const handleDelete = (sourceFile: string) => {
    setExpenses(prev => prev.filter(exp => exp.sourceFile !== sourceFile));
  };

  const handleSyncAll = async () => {
    if (!isNotionConfigured) {
      toast.error('Notion is not configured. Please set up Notion integration first.');
      return;
    }

    const unsyncedExpenses = expenses.filter(
      exp => exp.status !== 'synced' && exp.status !== 'error'
    );

    for (const expense of unsyncedExpenses) {
      await handleSync(expense);
    }
  };

  const handleExtractAll = () => {
    const pendingFiles = expenses
      .filter(exp => exp.status === 'pending' && exp.sourceFile)
      .map(exp => new File([], exp.sourceFile as string));

    handleFilesAccepted(pendingFiles);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Receipt → Notion Expense Uploader</h1>
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isNotionConfigured ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm text-gray-600">
            {isNotionConfigured ? 'Notion Connected' : 'Notion Optional'}
          </span>
        </div>
      </div>

      <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          {!isNotionConfigured
            ? 'Notion integration is not configured. You can still use AI receipt parsing and save the results locally.'
            : 'Ready to sync expenses with Notion'}
        </p>
      </div>

      <FileDropzone
        onFilesAccepted={handleFilesAccepted}
        isProcessing={Object.keys(processingStatus).length > 0}
      />

      {expenses.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-end space-x-4 mb-4">
            {isNotionConfigured && (
              <button
                onClick={handleSyncAll}
                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded disabled:opacity-50"
                disabled={Object.keys(processingStatus).length > 0}
              >
                Send All to Notion
              </button>
            )}
          </div>

          <div className="space-y-4">
            {expenses.map((expense) => (
              <ExpenseEditorRow
                key={expense.id}
                expense={expense}
                progress={processingStatus[expense.sourceFile || '']?.progress || 0}
                status={processingStatus[expense.sourceFile || '']?.status}
                onUpdate={(updated) => handleExpenseUpdate(expense.sourceFile!, updated)}
                onSync={() => handleSync(expense)}
                onDelete={() => handleDelete(expense.sourceFile!)}
                notionEnabled={isNotionConfigured}
              />
            ))}
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </main>
  );
}
