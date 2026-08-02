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

/** RPC controller contracts for ai-service. */

export interface IUsageRpcController {
  findUsage(payload: { userId: string }): Promise<AiUsageResponseDTO[]>;
  checkCredits(payload: { userId: string }): Promise<CreditsResponseDTO>;
}

export interface IMessageRpcController {
  sendMessage(payload: {
    userId: string;
    conversationId: string;
    content: string;
    provider?: 'anthropic' | 'openai' | 'deepseek' | 'gemini';
    model?: string;
  }): Promise<SendMessageResponseDTO>;
  findMessages(payload: {
    userId: string;
    conversationId: string;
  }): Promise<AiMessageResponseDTO[]>;
}

export interface IConversationRpcController {
  createConversation(
    payload: CreateConversationRequestDTO & { userId: string },
  ): Promise<ConversationResponseDTO>;
  findConversations(payload: {
    userId: string;
  }): Promise<ConversationResponseDTO[]>;
  findConversation(payload: {
    userId: string;
    id: string;
  }): Promise<ConversationResponseDTO>;
  removeConversation(payload: {
    userId: string;
    id: string;
  }): Promise<DeleteResponseDTO>;
}
