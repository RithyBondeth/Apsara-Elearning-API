import { DeleteResponseDTO } from '../../dtos/common/delete-response.dto';
import {
  ConversationResponseDTO,
  CreateConversationRequestDTO,
} from '../../dtos/ai/conversation.dto';
import {
  AiMessageResponseDTO,
  SendMessageRequestDTO,
  SendMessageResponseDTO,
} from '../../dtos/ai/message.dto';
import {
  AiUsageResponseDTO,
  CreditsResponseDTO,
} from '../../dtos/ai/usage.dto';

/** HTTP gateway controller contract for the AI domain (api-gateway). */
export interface IAiHttpController {
  createConversation(
    userId: string,
    dto: CreateConversationRequestDTO,
  ): Promise<ConversationResponseDTO>;
  listConversations(userId: string): Promise<ConversationResponseDTO[]>;
  getConversation(userId: string, id: string): Promise<ConversationResponseDTO>;
  deleteConversation(userId: string, id: string): Promise<DeleteResponseDTO>;
  sendMessage(
    userId: string,
    conversationId: string,
    dto: SendMessageRequestDTO,
  ): Promise<SendMessageResponseDTO>;
  listMessages(
    userId: string,
    conversationId: string,
  ): Promise<AiMessageResponseDTO[]>;
  usage(userId: string): Promise<AiUsageResponseDTO[]>;
  credits(userId: string): Promise<CreditsResponseDTO>;
}
