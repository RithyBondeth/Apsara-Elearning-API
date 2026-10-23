import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { I_CONVERSATION_SERVICE, I_USAGE_SERVICE } from '@app/contracts';
import type {
  IConversationService,
  IMessageService,
  IUsageService,
} from '@app/contracts';
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
import {
  IChatResult,
  IChatTurn,
} from '@app/contracts/interfaces/ai/ai-service.interface';
import { AiGatewayService } from '../providers/ai-gateway.service';
import { buildSystemPrompt } from '../anthropic/system-prompt';
import { LessonContextService } from './lesson-context.service';
import {
  EntitlementService,
  RpcAppException,
  RpcTooManyRequestsException,
} from '@app/common';
import { AiProviderTimeoutError } from '../providers/ai-provider.interface';

/**
 * Prior messages resent with each turn. Every turn bills the whole history as
 * prompt tokens, so an unbounded history makes long conversations steadily
 * more expensive per reply.
 */
export const MAX_HISTORY_MESSAGES = 20;

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
    @Inject(I_USAGE_SERVICE) private readonly usage: IUsageService,
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
  ): Promise<SendMessageResponseDTO> {
    await this.entitlements.assert(userId, 'ai:tutor');
    // Ownership check (throws 404 if not the user's conversation).
    await this.conversations.findOneOwned(userId, conversationId);

    // Before persisting anything, so a refused turn leaves no orphan message.
    const credits = await this.usage.checkCredits(userId);
    if (!credits.hasCredits) {
      throw new RpcTooManyRequestsException(
        credits.exhausted === 'replies'
          ? `You have used all ${credits.repliesLimit} Apsara AI replies for this billing period.`
          : 'You have used your Apsara AI allowance for the last 30 days. Please try again later.',
      );
    }

    // Build history from recent prior turns + the new user message.
    const prior = await this.findByConversation(conversationId);
    const history: IChatTurn[] = [
      ...this.recentTurns(prior),
      { role: 'user', content },
    ];

    // Persist the user message.
    await this.db
      .insert(aiMessages)
      .values({ conversationId, role: 'user', content });

    // Ground the reply in whatever lesson the student is currently on.
    const context = await this.lessonContext.findCurrent(userId);
    const result = await this.reply(buildSystemPrompt(context), history);

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

  /** The provider's reply, with a timeout reported as a 504 the learner can retry. */
  private async reply(
    system: string,
    history: IChatTurn[],
  ): Promise<IChatResult> {
    try {
      return await this.ai.chat(system, history);
    } catch (error) {
      if (error instanceof AiProviderTimeoutError) {
        this.logger.warn(error.message);
        throw new RpcAppException(
          HttpStatus.GATEWAY_TIMEOUT,
          'Apsara AI took too long to reply. Please try again.',
          'Gateway Timeout',
        );
      }
      throw error;
    }
  }

  /**
   * The last MAX_HISTORY_MESSAGES user/assistant turns. A window that would
   * open on an assistant reply drops it: providers expect the conversation to
   * start with the user.
   */
  private recentTurns(prior: AiMessageResponseDTO[]): IChatTurn[] {
    const turns = prior
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content ?? '',
      }));
    while (turns[0]?.role === 'assistant') turns.shift();
    return turns;
  }
}
