import { Client } from '@notionhq/client';
import { config } from './config';
import { ExpenseItem } from '../types/expense';

// Only create Notion client if configuration exists
const notion = config.NOTION_TOKEN ? new Client({
  auth: config.NOTION_TOKEN,
}) : null;

export class NotionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotionError';
  }
}

export async function createExpense(item: ExpenseItem): Promise<{ id: string }> {
  if (!notion || !config.NOTION_DATABASE_ID) {
    throw new NotionError('Notion is not configured');
  }

  try {
    const response = await notion.pages.create({
      parent: {
        database_id: config.NOTION_DATABASE_ID,
      },
      properties: {
        Expense: {
          title: [
            {
              text: {
                content: item.expense,
              },
            },
          ],
        },
        '#amount': {
          number: item.amount,
        },
        category: {
          select: {
            name: item.category,
          },
        },
        date: {
          date: {
            start: item.date,
          },
        },
      },
    });

    return { id: response.id };
  } catch (error) {
    throw new NotionError(
      error instanceof Error ? error.message : 'Failed to create expense in Notion'
    );
  }
}
