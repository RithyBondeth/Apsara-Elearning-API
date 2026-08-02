import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';

@Injectable()
export class OpenAiProvider extends OpenAiCompatibleProvider {
  constructor(configService: ConfigService) {
    super({
      provider: 'openai',
      apiKey: configService.get<string>('ai.openaiApiKey'),
      baseUrl:
        configService.get<string>('ai.openaiBaseUrl') ??
        'https://api.openai.com/v1',
      defaultModel:
        configService.get<string>('ai.openaiModel') ??
        configService.get<string>('ai.model') ??
        'gpt-4o-mini',
      maxTokens: configService.get<number>('ai.maxTokens') ?? 4096,
    });
  }
}
