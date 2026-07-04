import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { AiGatewayService } from './providers/ai-gateway.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { ConversationRpcService } from './services/conversation-rpc.service';
import { MessageRpcService } from './services/message-rpc.service';
import { UsageRpcService } from './services/usage-rpc.service';
import { ConversationRpcController } from './controllers/conversation-rpc.controller';
import { MessageRpcController } from './controllers/message-rpc.controller';
import { UsageRpcController } from './controllers/usage-rpc.controller';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule],
  controllers: [
    ConversationRpcController,
    MessageRpcController,
    UsageRpcController,
  ],
  providers: [
    AiGatewayService,
    AnthropicProvider,
    OpenAiProvider,
    DeepSeekProvider,
    GeminiProvider,
    ConversationRpcService,
    MessageRpcService,
    UsageRpcService,
  ],
})
export class AiServiceModule {}
