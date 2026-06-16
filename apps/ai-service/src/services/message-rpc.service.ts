import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { aiMessages } from '@app/database/schemas/ai/ai-message.schema';
import { aiConversations } from '@app/database/schemas/ai/ai-conversation.schema';
import { aiUsageTracking } from '@app/database/schemas/ai/ai-usage-tracking.schema';
import { DRIZZLE } from '@app/contracts';
import { AnthropicService, ChatTurn } from '../anthropic/anthropic.service';
import { APSARA_SYSTEM_PROMPT } from '../anthropic/system-prompt';
import { ConversationRpcService } from './conversation-rpc.service';

@Injectable()
export class MessageRpcService {
  private readonly logger = new Logger(MessageRpcService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>,
    private readonly anthropic: AnthropicService,
    private readonly conversations: ConversationRpcService,
  ) {}

  findByConversation(conversationId: string) {
    return this.db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);
  }

  async send(userId: string, conversationId: string, content: string) {
    // Ownership check (throws 404 if not the user's conversation).
    await this.conversations.findOneOwned(userId, conversationId);

    // Build history from prior turns + the new user message.
    const prior = await this.findByConversation(conversationId);
    const history: ChatTurn[] = [
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

    // Call Claude (or mock).
    const result = await this.anthropic.chat(APSARA_SYSTEM_PROMPT, history);

    // Persist the assistant reply.
    const [assistant] = await this.db
      .insert(aiMessages)
      .values({
        conversationId,
        role: 'assistant',
        content: result.text,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
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
    });

    this.logger.log(
      `Reply in ${conversationId} (${result.mock ? 'mock' : 'live'}, ${result.completionTokens} out tokens)`,
    );
    return { message: assistant, mock: result.mock };
  }
}
