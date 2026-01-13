
export interface TranscriptionJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  transcript?: string;
  error?: string;
  audioUrl?: string;
  timestamp: number;
  configAtTime?: TranscriptionConfig;
}

export enum ModelName {
  FLASH_3 = 'gemini-3-flash-preview',
  PRO_3 = 'gemini-3-pro-preview'
}

export interface TranscriptionConfig {
  systemInstruction: string;
  userPrompt: string;
  model: ModelName;
  name: string;
}

export const PRESETS: Record<string, TranscriptionConfig> = {
  narrative: {
    name: "Clean Narrative",
    model: ModelName.FLASH_3,
    systemInstruction: "You are an expert transcriptionist. Convert the audio into clean, professional paragraphs. Remove filler words (um, uh, like), stutters, and false starts. Ensure grammatical correctness while preserving the speaker's intent.",
    userPrompt: "Transcribe this audio into clean narrative paragraphs. Do not add any introductory or concluding text."
  },
  bilingual: {
    name: "Bilingual Pair (BN-EN)",
    model: ModelName.FLASH_3,
    systemInstruction: "You are a professional translator and transcriptionist. Format the output strictly as a list of pairs: 'Bengali Text - English Translation'. Absolutely no meta-talk or timestamps.",
    userPrompt: "Transcribe and translate. Format: 'Bengali - English'. Every sentence on its own line."
  },
  meeting: {
    name: "Meeting Minutes",
    model: ModelName.PRO_3,
    systemInstruction: "You are an executive assistant. Analyze the audio and extract the key discussion points, decisions made, and specific action items. Use Markdown for structure.",
    userPrompt: "Provide a structured summary of this meeting including: 1. Main Topics, 2. Key Decisions, 3. Action Items with owners if mentioned."
  },
  verbatim: {
    name: "Verbatim Script",
    model: ModelName.FLASH_3,
    systemInstruction: "You are a legal transcriptionist. Provide a word-for-word account of the audio. Include all filler words, pauses, and non-verbal cues if relevant. Use Speaker A, Speaker B labels.",
    userPrompt: "Transcribe the audio verbatim with speaker labels."
  },
  customtext: {
    name: "Clean Text number list",
    model: ModelName.FLASH_3,
    systemInstruction: "You are an expert transcriptionist. Convert the audio into clean, professional (-) list sentence text",
    userPrompt: "Transcipt this audio"
  },

  custom: {
    name: "Custom Instruction",
    model: ModelName.FLASH_3,
    systemInstruction: "You are a helpful transcription assistant.",
    userPrompt: "Transcribe the following audio."
  }
};
