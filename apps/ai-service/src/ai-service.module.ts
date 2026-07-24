import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule, HealthModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import {
  I_CONVERSATION_SERVICE,
  I_MESSAGE_SERVICE,
  I_USAGE_SERVICE,
} from '@app/contracts';
import { AiHealthController } from './health/health.controller';
import { AiGatewayService } from './providers/ai-gateway.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { UsageService } from './services/usage.service';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { UsageController } from './controllers/usage.controller';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule, HealthModule],
  controllers: [
    ConversationController,
    MessageController,
    UsageController,
    AiHealthController,
  ],
  providers: [
    AiGatewayService,
    AnthropicProvider,
    OpenAiProvider,
    DeepSeekProvider,
    GeminiProvider,
    { provide: I_CONVERSATION_SERVICE, useClass: ConversationService },
    { provide: I_MESSAGE_SERVICE, useClass: MessageService },
    { provide: I_USAGE_SERVICE, useClass: UsageService },
  ],
})
export class AiServiceModule {}
