import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { aiConversations } from '@app/database/schemas/ai/ai-conversation.schema';
import {
  ConversationResponseDTO,
  CreateConversationRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  IConversationService,
} from '@app/contracts';
import { EntitlementService, RpcNotFoundException } from '@app/common';

@Injectable()
export class ConversationService implements IConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: EntitlementService,
  ) {}

  async create(
    userId: string,
    dto: CreateConversationRequestDTO,
  ): Promise<ConversationResponseDTO> {
    await this.entitlements.assert(userId, 'ai:tutor');
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
    return new ConversationResponseDTO(created);
  }

  async findAllByUser(userId: string): Promise<ConversationResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(aiConversations.updatedAt);
    return rows.map((row) => new ConversationResponseDTO(row));
  }

  /** Fetches a conversation and enforces ownership. */
  async findOneOwned(
    userId: string,
    id: string,
  ): Promise<ConversationResponseDTO> {
    const [found] = await this.db
      .select()
      .from(aiConversations)
      .where(
        and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)),
      )
      .limit(1);
    if (!found) throw new RpcNotFoundException('Conversation not found');
    return new ConversationResponseDTO(found);
  }

  async remove(userId: string, id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(aiConversations)
      .where(
        and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)),
      )
      .returning({ id: aiConversations.id });
    if (!deleted) throw new RpcNotFoundException('Conversation not found');
    return new DeleteResponseDTO({
      message: 'Conversation deleted successfully',
      id,
    });
  }
}
