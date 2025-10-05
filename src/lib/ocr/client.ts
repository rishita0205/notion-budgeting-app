import { ExpenseItem } from '../../types/expense';
// import OpenAI from 'openai';  // removed, now using Hugging Face inference API

export type OcrProgressCallback = (progress: { status: string; progress: number }) => void;


export async function extractTextFromImage(
  imageData: string,
  onProgress?: OcrProgressCallback
): Promise<ExpenseItem> {
  try {
    console.log('🤖 Starting AI parsing of image...');
    if (onProgress) onProgress({ status: 'starting', progress: 0 });
    // ensure API key is set
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Missing HUGGINGFACE_API_KEY in environment');
    }
    // Call Hugging Face flan-t5-small endpoint (free inference API)
  const response = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-small',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `Extract expense (string), amount (number), category (string) from Base64 image: ${imageData}. Output valid JSON.`
        })
      }
    );
    // surface HTTP errors
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Hugging Face inference error ${response.status}: ${text}`);
    }
    if (onProgress) onProgress({ status: 'ai_complete', progress: 100 });
    const hfResult = await response.json();
    const aiContent =
      hfResult.generated_text || (Array.isArray(hfResult) ? hfResult[0]?.generated_text : '') || '';
    console.log('✅ AI response content:', aiContent);
    try {
      return JSON.parse(aiContent) as ExpenseItem;
    } catch (e) {
      throw new Error(`Failed to parse AI output as JSON: ${aiContent}`);
    }
  } catch (error) {
    console.error('❌ Error processing receipt via AI:', error);
    throw error;
  }
}

// No cleanup required
export const cleanupOCR = async (): Promise<void> => {};
