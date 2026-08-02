import { Inject, Injectable, Logger } from '@nestjs/common';
import { I_CONVERSATION_SERVICE } from '@app/contracts';
import type { IConversationService, IMessageService } from '@app/contracts';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { aiMessages } from '@app/database/schemas/ai/ai-message.schema';
import { aiConversations } from '@app/database/schemas/ai/ai-conversation.schema';
import { aiUsageTracking } from '@app/database/schemas/ai/ai-usage-tracking.schema';
import {
  AiMessageResponseDTO,
  DRIZZLE,
  SendMessageResponseDTO,
} from '@app/contracts';
import { IChatTurn } from '@app/contracts/interfaces/ai/ai-service.interface';
import {
  AiGatewayChatOptions,
  AiGatewayService,
} from '../providers/ai-gateway.service';
import { buildSystemPrompt } from '../anthropic/system-prompt';
import { LessonContextService } from './lesson-context.service';
import { EntitlementService } from '@app/common';

@Injectable()
export class MessageService implements IMessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly ai: AiGatewayService,
    private readonly entitlements: EntitlementService,
    private readonly lessonContext: LessonContextService,
    @Inject(I_CONVERSATION_SERVICE)
    private readonly conversations: IConversationService,
  ) {}

  async findByConversation(
    conversationId: string,
  ): Promise<AiMessageResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);
    return rows.map((row) => new AiMessageResponseDTO(row));
  }

  async send(
    userId: string,
    conversationId: string,
    content: string,
    options?: AiGatewayChatOptions,
  ): Promise<SendMessageResponseDTO> {
    await this.entitlements.assert(userId, 'ai:tutor');
    // Ownership check (throws 404 if not the user's conversation).
    await this.conversations.findOneOwned(userId, conversationId);

    // Build history from prior turns + the new user message.
    const prior = await this.findByConversation(conversationId);
    const history: IChatTurn[] = [
      ...prior
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content ?? '',
        })),
      { role: 'user', content },
    ];

    // Persist the user message.
    await this.db
      .insert(aiMessages)
      .values({ conversationId, role: 'user', content });

    // Ground the reply in whatever lesson the student is currently on.
    const context = await this.lessonContext.findCurrent(userId);
    const result = await this.ai.chat(
      buildSystemPrompt(context),
      history,
      options,
    );

    // Persist the assistant reply.
    const [assistant] = await this.db
      .insert(aiMessages)
      .values({
        conversationId,
        role: 'assistant',
        content: result.text,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        provider: result.provider,
        model: result.model,
      })
      .returning();

    // Touch the conversation so it sorts to the top of the user's list.
    await this.db
      .update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId));

    // Record usage.
    await this.db.insert(aiUsageTracking).values({
      userId,
      feature: 'chat',
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.promptTokens + result.completionTokens,
      provider: result.provider,
      model: result.model,
    });

    this.logger.log(
      `Reply in ${conversationId} (${result.provider}/${result.model}, ${
        result.mock ? 'mock' : 'live'
      }, ${result.completionTokens} out tokens)`,
    );
    return new SendMessageResponseDTO({
      message: new AiMessageResponseDTO(assistant),
      mock: result.mock,
    });
  }
}
