import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IChatResult,
  IChatTurn,
} from '@app/contracts/interfaces/ai/ai-service.interface';
import { AnthropicProvider } from './anthropic.provider';
import { DeepSeekProvider } from './deepseek.provider';
import { GeminiProvider } from './gemini.provider';
import { OpenAiProvider } from './openai.provider';
import { AiProvider, AiProviderName } from './ai-provider.interface';

export interface AiGatewayChatOptions {
  provider?: AiProviderName;
  model?: string;
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly providers: Record<AiProviderName, AiProvider>;
  private readonly defaultProvider: AiProviderName;

  constructor(
    configService: ConfigService,
    anthropic: AnthropicProvider,
    openai: OpenAiProvider,
    deepseek: DeepSeekProvider,
    gemini: GeminiProvider,
  ) {
    this.providers = {
      anthropic,
      openai,
      deepseek,
      gemini,
    };
    this.defaultProvider = this.normalizeProvider(
      configService.get<string>('ai.provider') ?? 'anthropic',
    );

    Object.values(this.providers)
      .filter((provider) => !provider.enabled)
      .forEach((provider) => {
        this.logger.warn(
          `${provider.provider} API key not set - provider will use mock responses`,
        );
      });
  }

  async chat(
    system: string,
    history: IChatTurn[],
    options?: AiGatewayChatOptions,
  ): Promise<IChatResult> {
    const providerName = options?.provider ?? this.defaultProvider;
    const provider = this.providers[providerName];

    return provider.chat(system, history, { model: options?.model });
  }

  private normalizeProvider(provider: string): AiProviderName {
    if (this.isProviderName(provider)) {
      return provider;
    }

    throw new BadRequestException(`Unsupported AI provider: ${provider}`);
  }

  private isProviderName(provider: string): provider is AiProviderName {
    return ['anthropic', 'openai', 'deepseek', 'gemini'].includes(provider);
  }
}
