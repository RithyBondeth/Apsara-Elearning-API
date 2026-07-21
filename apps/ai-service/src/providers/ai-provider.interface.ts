import {
  IChatResult,
  IChatTurn,
} from '@app/contracts/interfaces/ai/ai-service.interface';

export type AiProviderName = 'anthropic' | 'openai' | 'deepseek' | 'gemini';

export interface AiChatOptions {
  model?: string;
}

export interface AiProvider {
  readonly provider: AiProviderName;
  readonly enabled: boolean;
  readonly defaultModel: string;

  chat(
    system: string,
    history: IChatTurn[],
    options?: AiChatOptions,
  ): Promise<IChatResult>;
}
