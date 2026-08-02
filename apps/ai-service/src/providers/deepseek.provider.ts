import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';

@Injectable()
export class DeepSeekProvider extends OpenAiCompatibleProvider {
  constructor(configService: ConfigService) {
    super({
      provider: 'deepseek',
      apiKey: configService.get<string>('ai.deepseekApiKey'),
      baseUrl:
        configService.get<string>('ai.deepseekBaseUrl') ??
        'https://api.deepseek.com',
      defaultModel:
        configService.get<string>('ai.deepseekModel') ??
        configService.get<string>('ai.model') ??
        'deepseek-chat',
      maxTokens: configService.get<number>('ai.maxTokens') ?? 4096,
    });
  }
}
