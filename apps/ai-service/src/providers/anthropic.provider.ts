import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  IChatResult,
  IChatTurn,
} from '@app/contracts/interfaces/ai/ai-service.interface';
import {
  AiChatOptions,
  AiProvider,
  AiProviderTimeoutError,
} from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly provider = 'anthropic' as const;
  readonly defaultModel: string;
  private readonly client: Anthropic | null;
  private readonly maxTokens: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.anthropicApiKey');
    this.defaultModel =
      this.configService.get<string>('ai.anthropicModel') ??
      this.configService.get<string>('ai.model') ??
      'claude-opus-4-8';
    this.maxTokens = this.configService.get<number>('ai.maxTokens') ?? 4096;
    // No SDK retries: each would get the full timeout again, and the gateway
    // only waits ai.requestTimeoutMs (+ margin) for the whole reply.
    this.client = apiKey
      ? new Anthropic({
          apiKey,
          timeout:
            this.configService.get<number>('ai.requestTimeoutMs') ?? 60_000,
          maxRetries: 0,
        })
      : null;
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  async chat(
    system: string,
    history: IChatTurn[],
    options?: AiChatOptions,
  ): Promise<IChatResult> {
    const model = options?.model ?? this.defaultModel;

    if (!this.client) {
      const last = history[history.length - 1]?.content ?? '';
      return {
        text:
          `[Apsara AI - dev mode] I received: "${last.slice(0, 280)}". ` +
          `Set ANTHROPIC_API_KEY to enable real Claude responses.`,
        promptTokens: 0,
        completionTokens: 0,
        provider: this.provider,
        model,
        mock: true,
      };
    }

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model,
        max_tokens: this.maxTokens,
        system,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      });
    } catch (error) {
      if (error instanceof Anthropic.APIConnectionTimeoutError) {
        throw new AiProviderTimeoutError(this.provider);
      }
      throw error;
    }

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { text: string }).text)
      .join('');

    return {
      text,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      provider: this.provider,
      model,
      mock: false,
    };
  }
}
