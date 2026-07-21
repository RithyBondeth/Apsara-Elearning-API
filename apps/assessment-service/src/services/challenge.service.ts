import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { codingChallenges } from '@app/database/schemas/challenge/coding-challenge.schema';
import { challengeTestCases } from '@app/database/schemas/challenge/challenge-test-case.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import {
  CreateChallengeRequestDTO,
  CreateTestCaseRequestDTO,
  DRIZZLE,
  UpdateChallengeRequestDTO,
  UpdateTestCaseRequestDTO,
} from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';

@Injectable()
export class ChallengeService {
  private readonly logger = new Logger(ChallengeService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  // ---- Challenge ----
  async createChallenge(lessonId: string, dto: CreateChallengeRequestDTO) {
    const [lesson] = await this.db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new RpcBadRequestException('Lesson does not exist');

    const [created] = await this.db
      .insert(codingChallenges)
      .values({
        lessonId,
        title: dto.title,
        description: dto.description,
        starterCode: dto.starterCode,
        solutionCode: dto.solutionCode,
        xpReward: dto.xpReward,
      })
      .returning();
    this.logger.log(`Challenge created: ${created.id}`);
    return created;
  }

  findChallengesByLesson(lessonId: string) {
    return this.db
      .select()
      .from(codingChallenges)
      .where(eq(codingChallenges.lessonId, lessonId));
  }

  async findChallenge(id: string) {
    const [found] = await this.db
      .select()
      .from(codingChallenges)
      .where(eq(codingChallenges.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Challenge not found');
    return found;
  }

  async updateChallenge(id: string, dto: UpdateChallengeRequestDTO) {
    const [updated] = await this.db
      .update(codingChallenges)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(codingChallenges.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Challenge not found');
    return updated;
  }

  async removeChallenge(id: string) {
    const [deleted] = await this.db
      .delete(codingChallenges)
      .where(eq(codingChallenges.id, id))
      .returning({ id: codingChallenges.id });
    if (!deleted) throw new RpcNotFoundException('Challenge not found');
    return { message: 'Challenge deleted successfully', id };
  }

  // ---- Test cases ----
  async createTestCase(challengeId: string, dto: CreateTestCaseRequestDTO) {
    await this.findChallenge(challengeId); // 404 if challenge missing
    const [created] = await this.db
      .insert(challengeTestCases)
      .values({
        challengeId,
        input: dto.input,
        expectedOutput: dto.expectedOutput,
        isHidden: dto.isHidden ?? false,
        order: dto.order,
      })
      .returning();
    return created;
  }

  /** `includeHidden` is for admins; students see visible cases only. */
  findTestCases(challengeId: string, includeHidden = false) {
    const where = includeHidden
      ? eq(challengeTestCases.challengeId, challengeId)
      : and(
          eq(challengeTestCases.challengeId, challengeId),
          eq(challengeTestCases.isHidden, false),
        );
    return this.db
      .select()
      .from(challengeTestCases)
      .where(where)
      .orderBy(challengeTestCases.order);
  }

  async updateTestCase(id: string, dto: UpdateTestCaseRequestDTO) {
    const [updated] = await this.db
      .update(challengeTestCases)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(challengeTestCases.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Test case not found');
    return updated;
  }

  async removeTestCase(id: string) {
    const [deleted] = await this.db
      .delete(challengeTestCases)
      .where(eq(challengeTestCases.id, id))
      .returning({ id: challengeTestCases.id });
    if (!deleted) throw new RpcNotFoundException('Test case not found');
    return { message: 'Test case deleted successfully', id };
  }
}
