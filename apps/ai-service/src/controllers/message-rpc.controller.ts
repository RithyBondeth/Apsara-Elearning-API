import { Controller } from '@nestjs/common';
import { MessageRpcService } from '../services/message-rpc.service';
import { AI_SERVICE } from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConversationRpcService } from '../services/conversation-rpc.service';

@Controller('message')
export class MessageRpcController {
  constructor(
    private readonly messagesService: MessageRpcService,
    private readonly conversationsService: ConversationRpcService,
  ) {}

  @MessagePattern(AI_SERVICE.ACTIONS.MESSAGE_SEND)
  sendMessage(
    @Payload()
    payload: {
      userId: string;
      conversationId: string;
      content: string;
      provider?: 'anthropic' | 'openai' | 'deepseek' | 'gemini';
      model?: string;
    },
  ) {
    return this.messagesService.send(
      payload.userId,
      payload.conversationId,
      payload.content,
      {
        provider: payload.provider,
        model: payload.model,
      },
    );
  }

  @MessagePattern(AI_SERVICE.ACTIONS.MESSAGE_FIND_ALL)
  async findMessages(
    @Payload() payload: { userId: string; conversationId: string },
  ) {
    // Enforce ownership before returning the transcript.
    await this.conversationsService.findOneOwned(
      payload.userId,
      payload.conversationId,
    );
    return this.messagesService.findByConversation(payload.conversationId);
  }
}
