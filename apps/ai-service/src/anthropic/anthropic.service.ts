import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  mock: boolean;
}

/**
 * Wraps the Anthropic SDK. When ANTHROPIC_API_KEY is set it calls Claude;
 * otherwise it returns a deterministic mock so the service is usable in dev.
 */
@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.anthropicApiKey');
    this.model =
      this.configService.get<string>('ai.model') ?? 'claude-opus-4-8';
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    if (!this.client) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — AI service is running in MOCK mode',
      );
    }
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  async chat(system: string, history: ChatTurn[]): Promise<ChatResult> {
    if (!this.client) {
      const last = history[history.length - 1]?.content ?? '';
      return {
        text:
          `[Apsara AI — dev mode] I received: "${last.slice(0, 280)}". ` +
          `Set ANTHROPIC_API_KEY to enable real Claude responses.`,
        promptTokens: 0,
        completionTokens: 0,
        mock: true,
      };
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { text: string }).text)
      .join('');

    return {
      text,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      mock: false,
    };
  }
}
