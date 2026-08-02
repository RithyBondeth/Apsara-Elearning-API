import { Controller, Inject } from '@nestjs/common';
import { I_CONVERSATION_SERVICE } from '@app/contracts';
import type {
  IConversationRpcController,
  IConversationService,
} from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AI_SERVICE, CreateConversationRequestDTO } from '@app/contracts';

@Controller('conversation')
export class ConversationController implements IConversationRpcController {
  constructor(
    @Inject(I_CONVERSATION_SERVICE)
    private readonly conversations: IConversationService,
  ) {}

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
