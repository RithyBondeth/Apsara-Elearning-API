import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AI_SERVICE,
  CreateConversationRequestDTO,
} from '@app/contracts';
import { ConversationRpcService } from '../services/conversation-rpc.service';
import { MessageRpcService } from '../services/message-rpc.service';
import { UsageRpcService } from '../services/usage-rpc.service';

@Controller()
export class AiRpcController {
  constructor(
    private readonly conversations: ConversationRpcService,
    private readonly messages: MessageRpcService,
    private readonly usage: UsageRpcService,
  ) {}

  // ---- Conversations ----
  @MessagePattern(AI_SERVICE.ACTIONS.CONVERSATION_CREATE)
  createConversation(
    @Payload()
    payload: CreateConversationRequestDTO & { userId: string },
  ) {
    const { userId, ...dto } = payload;
    return this.conversations.create(userId, dto);
  }

  @MessagePattern(AI_SERVICE.ACTIONS.CONVERSATION_FIND_ALL)
  findConversations(@Payload() payload: { userId: string }) {
    return this.conversations.findAllByUser(payload.userId);
  }

  @MessagePattern(AI_SERVICE.ACTIONS.CONVERSATION_FIND_ONE)
  findConversation(@Payload() payload: { userId: string; id: string }) {
    return this.conversations.findOneOwned(payload.userId, payload.id);
  }

  @MessagePattern(AI_SERVICE.ACTIONS.CONVERSATION_DELETE)
  removeConversation(@Payload() payload: { userId: string; id: string }) {
    return this.conversations.remove(payload.userId, payload.id);
  }

  // ---- Messages ----
  @MessagePattern(AI_SERVICE.ACTIONS.MESSAGE_SEND)
  sendMessage(
    @Payload()
    payload: { userId: string; conversationId: string; content: string },
  ) {
    return this.messages.send(
      payload.userId,
      payload.conversationId,
      payload.content,
    );
  }

  @MessagePattern(AI_SERVICE.ACTIONS.MESSAGE_FIND_ALL)
  async findMessages(
    @Payload() payload: { userId: string; conversationId: string },
  ) {
    // Enforce ownership before returning the transcript.
    await this.conversations.findOneOwned(payload.userId, payload.conversationId);
    return this.messages.findByConversation(payload.conversationId);
  }

  // ---- Usage ----
  @MessagePattern(AI_SERVICE.ACTIONS.USAGE_FIND_BY_USER)
  findUsage(@Payload() payload: { userId: string }) {
    return this.usage.findByUser(payload.userId);
  }

  @MessagePattern(AI_SERVICE.ACTIONS.USAGE_CHECK_CREDITS)
  checkCredits(@Payload() payload: { userId: string }) {
    return this.usage.checkCredits(payload.userId);
  }
}
