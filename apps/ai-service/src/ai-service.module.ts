import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule, HealthModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { I_CONVERSATION_SERVICE, I_MESSAGE_SERVICE, I_USAGE_SERVICE } from '@app/contracts';
import { AiHealthController } from './health/health.controller';
import { AiGatewayService } from './providers/ai-gateway.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { ConversationRpcService } from './services/conversation.service';
import { MessageRpcService } from './services/message.service';
import { UsageRpcService } from './services/usage.service';
import { ConversationRpcController } from './controllers/conversation.controller';
import { MessageRpcController } from './controllers/message.controller';
import { UsageRpcController } from './controllers/usage.controller';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule, HealthModule],
  controllers: [
    ConversationRpcController,
    MessageRpcController,
    UsageRpcController,
    AiHealthController,
  ],
  providers: [
    AiGatewayService,
    AnthropicProvider,
    OpenAiProvider,
    DeepSeekProvider,
    GeminiProvider,
    { provide: I_CONVERSATION_SERVICE, useClass: ConversationRpcService },
    { provide: I_MESSAGE_SERVICE, useClass: MessageRpcService },
    { provide: I_USAGE_SERVICE, useClass: UsageRpcService },
  ],
})
export class AiServiceModule {}
