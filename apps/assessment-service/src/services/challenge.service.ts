import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { codingChallenges } from '@app/database/schemas/challenge/coding-challenge.schema';
import { challengeTestCases } from '@app/database/schemas/challenge/challenge-test-case.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import {
  ChallengeResponseDTO,
  CreateChallengeRequestDTO,
  CreateTestCaseRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  IChallengeService,
  TestCaseResponseDTO,
  UpdateChallengeRequestDTO,
  UpdateTestCaseRequestDTO,
} from '@app/contracts';
import {
  CourseEntitlementService,
  RpcBadRequestException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class ChallengeService implements IChallengeService {
  private readonly logger = new Logger(ChallengeService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: CourseEntitlementService,
  ) {}

  // ---- Challenge ----
  async createChallenge(
    lessonId: string,
    dto: CreateChallengeRequestDTO,
  ): Promise<ChallengeResponseDTO> {
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
    return new ChallengeResponseDTO(created);
  }

  async findChallengesByLesson(
    lessonId: string,
  ): Promise<ChallengeResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(codingChallenges)
      .where(eq(codingChallenges.lessonId, lessonId));
    return rows.map((row) => new ChallengeResponseDTO(row));
  }

  async findPublicChallengesByLesson(
    lessonId: string,
    userId: string,
  ): Promise<ChallengeResponseDTO[]> {
    await this.entitlements.assertCanReadLesson({ id: lessonId }, userId);
    const challenges = await this.findChallengesByLesson(lessonId);
    return challenges.map(
      (challenge) =>
        new ChallengeResponseDTO({ ...challenge, solutionCode: undefined }),
    );
  }

  async findChallenge(id: string): Promise<ChallengeResponseDTO> {
    const [found] = await this.db
      .select()
      .from(codingChallenges)
      .where(eq(codingChallenges.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Challenge not found');
    return new ChallengeResponseDTO(found);
  }

  async findPublicChallenge(
    id: string,
    userId: string,
  ): Promise<ChallengeResponseDTO> {
    const challenge = await this.findChallenge(id);
    await this.entitlements.assertCanReadLesson(
      { id: challenge.lessonId },
      userId,
    );
    return new ChallengeResponseDTO({
      ...challenge,
      solutionCode: undefined,
    });
  }

  async updateChallenge(
    id: string,
    dto: UpdateChallengeRequestDTO,
  ): Promise<ChallengeResponseDTO> {
    const [updated] = await this.db
      .update(codingChallenges)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(codingChallenges.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Challenge not found');
    return new ChallengeResponseDTO(updated);
  }

  async removeChallenge(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(codingChallenges)
      .where(eq(codingChallenges.id, id))
      .returning({ id: codingChallenges.id });
    if (!deleted) throw new RpcNotFoundException('Challenge not found');
    return new DeleteResponseDTO({
      message: 'Challenge deleted successfully',
      id,
    });
  }

  // ---- Test cases ----
  async createTestCase(
    challengeId: string,
    dto: CreateTestCaseRequestDTO,
  ): Promise<TestCaseResponseDTO> {
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
    return new TestCaseResponseDTO(created);
  }

  /** `includeHidden` is for admins; students see visible cases only. */
  async findTestCases(
    challengeId: string,
    includeHidden = false,
  ): Promise<TestCaseResponseDTO[]> {
    const where = includeHidden
      ? eq(challengeTestCases.challengeId, challengeId)
      : and(
          eq(challengeTestCases.challengeId, challengeId),
          eq(challengeTestCases.isHidden, false),
        );
    const rows = await this.db
      .select()
      .from(challengeTestCases)
      .where(where)
      .orderBy(challengeTestCases.order);
    return rows.map((row) => new TestCaseResponseDTO(row));
  }

  async findPublicTestCases(
    challengeId: string,
    userId: string,
  ): Promise<TestCaseResponseDTO[]> {
    await this.findPublicChallenge(challengeId, userId);
    return this.findTestCases(challengeId, false);
  }

  async updateTestCase(
    id: string,
    dto: UpdateTestCaseRequestDTO,
  ): Promise<TestCaseResponseDTO> {
    const [updated] = await this.db
      .update(challengeTestCases)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(challengeTestCases.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Test case not found');
    return new TestCaseResponseDTO(updated);
  }

  async removeTestCase(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(challengeTestCases)
      .where(eq(challengeTestCases.id, id))
      .returning({ id: challengeTestCases.id });
    if (!deleted) throw new RpcNotFoundException('Test case not found');
    return new DeleteResponseDTO({
      message: 'Test case deleted successfully',
      id,
    });
  }
}
