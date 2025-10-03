import { ExpenseItem } from '../../types/expense';
import OpenAI from 'openai';

export type OcrProgressCallback = (progress: { status: string; progress: number }) => void;


export async function extractTextFromImage(
  imageData: string,
  onProgress?: OcrProgressCallback
): Promise<ExpenseItem> {
  try {
    console.log('🤖 Starting AI parsing of image...');
    if (onProgress) onProgress({ status: 'starting', progress: 0 });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an assistant that extracts expense details from an image. Provide JSON with: expense (string), amount (number), category (string).' },
        { role: 'user', content: `Base64 image: ${imageData}` }
      ]
    });
    if (onProgress) onProgress({ status: 'ai_complete', progress: 100 });
    const aiContent = aiResponse.choices?.[0]?.message?.content || '';
    console.log('✅ AI response content:', aiContent);
    const parsed = JSON.parse(aiContent) as ExpenseItem;
    return parsed;
  } catch (error) {
    console.error('❌ Error processing receipt via AI:', error);
    throw error;
  }
}

// No cleanup required
export const cleanupOCR = async (): Promise<void> => {};
