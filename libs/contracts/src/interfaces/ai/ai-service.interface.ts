export interface IChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type IAiProviderName = 'anthropic' | 'openai' | 'deepseek' | 'gemini';

export interface IChatResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  provider: IAiProviderName;
  model: string;
  mock: boolean;
}
