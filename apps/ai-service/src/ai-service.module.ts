import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { AiRpcController } from './controllers/ai-rpc.controller';
import { AnthropicService } from './anthropic/anthropic.service';
import { ConversationRpcService } from './services/conversation-rpc.service';
import { MessageRpcService } from './services/message-rpc.service';
import { UsageRpcService } from './services/usage-rpc.service';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule],
  controllers: [AiRpcController],
  providers: [
    AnthropicService,
    ConversationRpcService,
    MessageRpcService,
    UsageRpcService,
  ],
})
export class AiServiceModule {}
