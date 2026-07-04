import { Logger } from '@nestjs/common';
import {
  IChatResult,
  IChatTurn,
} from '@app/contracts/interfaces/ai/ai-service.interface';
import {
  AiChatOptions,
  AiProvider,
  AiProviderName,
} from './ai-provider.interface';

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

export interface OpenAiCompatibleProviderOptions {
  provider: Extract<AiProviderName, 'openai' | 'deepseek'>;
  apiKey?: string;
  baseUrl: string;
  defaultModel: string;
  maxTokens: number;
}

export class OpenAiCompatibleProvider implements AiProvider {
  protected readonly logger: Logger;
  readonly provider: Extract<AiProviderName, 'openai' | 'deepseek'>;
  readonly defaultModel: string;
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;

  constructor(options: OpenAiCompatibleProviderOptions) {
    this.provider = options.provider;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.defaultModel = options.defaultModel;
    this.maxTokens = options.maxTokens;
    this.logger = new Logger(`${this.provider}Provider`);
  }

  get enabled(): boolean {
    return Boolean(this.apiKey);
  }

  async chat(
    system: string,
    history: IChatTurn[],
    options?: AiChatOptions,
  ): Promise<IChatResult> {
    if (!this.apiKey) {
      return this.mock(history);
    }

    const model = options?.model ?? this.defaultModel;
    const messages: ChatCompletionMessage[] = [
      { role: 'system', content: system },
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: this.maxTokens,
      }),
    });

    const data = (await response.json()) as ChatCompletionResponse;
    if (!response.ok) {
      throw new Error(
        `${this.provider} chat completion failed: ${
          data.error?.message ?? response.statusText
        }`,
      );
    }

    return {
      text: data.choices?.[0]?.message?.content ?? '',
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      provider: this.provider,
      model,
      mock: false,
    };
  }

  private mock(history: IChatTurn[]): IChatResult {
    const last = history[history.length - 1]?.content ?? '';
    return {
      text:
        `[Apsara AI - dev mode] I received: "${last.slice(0, 280)}". ` +
        `Set ${this.provider.toUpperCase()}_API_KEY to enable real responses.`,
      promptTokens: 0,
      completionTokens: 0,
      provider: this.provider,
      model: this.defaultModel,
      mock: true,
    };
  }
}
