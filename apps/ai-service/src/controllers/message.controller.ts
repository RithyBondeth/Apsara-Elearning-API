import { Controller, Inject } from '@nestjs/common';
import { I_CONVERSATION_SERVICE, I_MESSAGE_SERVICE } from '@app/contracts';
import type { IConversationService, IMessageRpcController, IMessageService } from '@app/contracts';
import { AI_SERVICE } from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('message')
export class MessageController implements IMessageRpcController {
  constructor(
    @Inject(I_MESSAGE_SERVICE) private readonly messagesService: IMessageService,
    @Inject(I_CONVERSATION_SERVICE) private readonly conversationsService: IConversationService,
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
