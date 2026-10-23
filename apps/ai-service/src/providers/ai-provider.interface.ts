import {
  IChatResult,
  IChatTurn,
} from '@app/contracts/interfaces/ai/ai-service.interface';

export type AiProviderName = 'anthropic' | 'openai' | 'deepseek' | 'gemini';

/** A provider call ran past ai.requestTimeoutMs. */
export class AiProviderTimeoutError extends Error {
  constructor(provider: AiProviderName) {
    super(`${provider} did not reply in time`);
    this.name = 'AiProviderTimeoutError';
  }
}

/** Thrown by `AbortSignal.timeout` when it fires. */
export const isAbortTimeout = (error: unknown): boolean =>
  error instanceof Error && error.name === 'TimeoutError';

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
