
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TranscriptionConfig, ModelName } from "../types";

export class GeminiService {
  async transcribeAudioStream(
    base64Audio: string, 
    mimeType: string, 
    config: TranscriptionConfig,
    onChunk: (text: string) => void
  ): Promise<void> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    try {
      const responseStream = await ai.models.generateContentStream({
        model: config.model,
        contents: [
          {
            parts: [
              { text: config.userPrompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Audio,
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction: config.systemInstruction,
          temperature: 0.15, // Lower temperature for more focused/faster transcription
          // Enable reasoning for Pro models to increase "power"
          thinkingConfig: config.model === ModelName.PRO_3 ? { thinkingBudget: 2048 } : undefined
        }
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          onChunk(text);
        }
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      throw new Error(error.message || "Engine failure during transcription.");
    }
  }
}

export const geminiService = new GeminiService();
