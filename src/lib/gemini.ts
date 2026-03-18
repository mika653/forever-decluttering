import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export interface AISuggestion {
  title: string;
  description: string;
  condition: string;
}

export async function analyzeItemPhoto(imageBase64: string, mimeType: string): Promise<AISuggestion> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: `You are helping someone list a second-hand item for sale. Look at this photo and return a JSON object with:
- "title": a short, catchy title for the listing (max 60 chars)
- "description": a helpful 1-2 sentence description mentioning what it is, notable features, and apparent condition
- "condition": one of "Brand New", "Like New", "Good", "Fair", "Well-loved"

Return ONLY the JSON object, no markdown, no backticks.`,
          },
        ],
      },
    ],
  });

  const text = response.text?.trim() || '';

  try {
    return JSON.parse(text) as AISuggestion;
  } catch {
    return {
      title: '',
      description: '',
      condition: 'Good',
    };
  }
}
