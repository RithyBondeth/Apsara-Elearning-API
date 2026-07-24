import { DeleteResponseDTO } from '../../dtos/common/delete-response.dto';
import {
  ConversationResponseDTO,
  CreateConversationRequestDTO,
} from '../../dtos/ai/conversation.dto';
import {
  AiMessageResponseDTO,
  SendMessageResponseDTO,
} from '../../dtos/ai/message.dto';
import {
  AiUsageResponseDTO,
  CreditsResponseDTO,
} from '../../dtos/ai/usage.dto';

/** DI tokens + service contracts for ai-service. */

export const I_CONVERSATION_SERVICE = 'IConversationService';
export const I_MESSAGE_SERVICE = 'IMessageService';
export const I_USAGE_SERVICE = 'IUsageService';

/** Provider/model overrides for a chat turn. */
export interface IChatOptions {
  provider?: 'anthropic' | 'openai' | 'deepseek' | 'gemini';
  model?: string;
}

export interface IConversationService {
  create(
    userId: string,
    dto: CreateConversationRequestDTO,
  ): Promise<ConversationResponseDTO>;
  findAllByUser(userId: string): Promise<ConversationResponseDTO[]>;
  findOneOwned(userId: string, id: string): Promise<ConversationResponseDTO>;
  remove(userId: string, id: string): Promise<DeleteResponseDTO>;
}

export interface IMessageService {
  findByConversation(conversationId: string): Promise<AiMessageResponseDTO[]>;
  send(
    userId: string,
    conversationId: string,
    content: string,
    options?: IChatOptions,
  ): Promise<SendMessageResponseDTO>;
}

export interface IUsageService {
  findByUser(userId: string): Promise<AiUsageResponseDTO[]>;
  checkCredits(userId: string): Promise<CreditsResponseDTO>;
}
