import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { aiConversations } from '@app/database/schemas/ai/ai-conversation.schema';
import { CreateConversationRequestDTO, DRIZZLE } from '@app/contracts';
import { RpcNotFoundException } from '@app/common';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(userId: string, dto: CreateConversationRequestDTO) {
    const [created] = await this.db
      .insert(aiConversations)
      .values({
        userId,
        title: dto.title?.trim() || 'New conversation',
        courseId: dto.courseId,
        lessonId: dto.lessonId,
      })
      .returning();
    this.logger.log(`Conversation created: ${created.id} for ${userId}`);
    return created;
  }

  findAllByUser(userId: string) {
    return this.db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(aiConversations.updatedAt);
  }

  /** Fetches a conversation and enforces ownership. */
  async findOneOwned(userId: string, id: string) {
    const [found] = await this.db
      .select()
      .from(aiConversations)
      .where(
        and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)),
      )
      .limit(1);
    if (!found) throw new RpcNotFoundException('Conversation not found');
    return found;
  }

  async remove(userId: string, id: string) {
    const [deleted] = await this.db
      .delete(aiConversations)
      .where(
        and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)),
      )
      .returning({ id: aiConversations.id });
    if (!deleted) throw new RpcNotFoundException('Conversation not found');
    return { message: 'Conversation deleted successfully', id };
  }
}
