import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AI_SERVICE, CreateConversationRequestDTO } from '@app/contracts';
import { ConversationRpcService } from '../services/conversation-rpc.service';

@Controller('conversation')
export class ConversationRpcController {
  constructor(private readonly conversations: ConversationRpcService) {}

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
}
