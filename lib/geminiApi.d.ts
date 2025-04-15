export interface TranslationResult {
  text: string;
  error?: string;
}

export interface TranslateOptions {
  texts: string[];
  targetLanguage: string;
  prompt: string;
  context?: string;
}

export function translateWithGemini(options: TranslateOptions): Promise<TranslationResult[]>; 