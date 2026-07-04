import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IChatResult,
  IChatTurn,
} from '@app/contracts/interfaces/ai/ai-service.interface';
import { AiChatOptions, AiProvider } from './ai-provider.interface';

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: {
    message?: string;
  };
};

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly provider = 'gemini' as const;
  readonly defaultModel: string;
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('ai.geminiApiKey');
    this.baseUrl =
      configService.get<string>('ai.geminiBaseUrl') ??
      'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel =
      configService.get<string>('ai.geminiModel') ??
      configService.get<string>('ai.model') ??
      'gemini-2.0-flash';
    this.maxTokens = configService.get<number>('ai.maxTokens') ?? 4096;
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
    const normalizedModel = model.replace(/^models\//, '');
    const url = `${this.baseUrl.replace(
      /\/$/,
      '',
    )}/models/${encodeURIComponent(normalizedModel)}:generateContent?key=${
      this.apiKey
    }`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: system }],
        },
        contents: history.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          maxOutputTokens: this.maxTokens,
        },
      }),
    });

    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      throw new Error(
        `gemini generateContent failed: ${
          data.error?.message ?? response.statusText
        }`,
      );
    }

    return {
      text:
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('') ?? '',
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
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
        'Set GEMINI_API_KEY to enable real Gemini responses.',
      promptTokens: 0,
      completionTokens: 0,
      provider: this.provider,
      model: this.defaultModel,
      mock: true,
    };
  }
}
