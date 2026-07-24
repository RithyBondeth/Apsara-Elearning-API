import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { challengeSubmissions } from '@app/database/schemas/challenge/challenge-submission.schema';
import {
  CreateSubmissionRequestDTO,
  DRIZZLE,
  ISubmissionService,
  SubmissionResponseDTO,
  SubmissionResultResponseDTO,
  USER_SERVICE,
} from '@app/contracts';
import { RpcNotFoundException } from '@app/common';
import { ChallengeService } from './challenge.service';
import { CodeExecutionService } from '../execution/code-execution.service';

@Injectable()
export class SubmissionService implements ISubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
    private readonly challenges: ChallengeService,
    private readonly executor: CodeExecutionService,
  ) {}

  async create(
    userId: string,
    challengeId: string,
    dto: CreateSubmissionRequestDTO,
  ): Promise<SubmissionResultResponseDTO> {
    const challenge = await this.challenges.findChallenge(challengeId);

    // Grade against ALL test cases (hidden included).
    const testCases = await this.challenges.findTestCases(challengeId, true);
    const result = await this.executor.grade(
      dto.language,
      dto.sourceCode,
      testCases.map((t) => ({
        input: t.input ?? null,
        expectedOutput: t.expectedOutput,
      })),
    );

    const score =
      result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;

    const [submission] = await this.db
      .insert(challengeSubmissions)
      .values({
        challengeId,
        userId,
        sourceCode: dto.sourceCode,
        language: dto.language,
        passed: result.allPassed,
        score,
        testCasesPassed: result.passed,
        testCasesTotal: result.total,
        executionTimeMs: result.executionTimeMs,
        errorMessage: result.errorMessage,
      })
      .returning();

    // Award the challenge's XP the first time the user fully passes it.
    let xpAwarded = 0;
    if (
      result.allPassed &&
      !(await this.hasPassedBefore(userId, challengeId, submission.id))
    ) {
      xpAwarded = await this.grantXp(userId, challenge.xpReward ?? 0);
    }

    this.logger.log(
      `Submission ${submission.id}: ${result.passed}/${result.total} (${result.mock ? 'mock' : 'judge0'})`,
    );
    return new SubmissionResultResponseDTO({
      submission: new SubmissionResponseDTO(submission),
      passed: result.allPassed,
      score,
      testCasesPassed: result.passed,
      testCasesTotal: result.total,
      xpAwarded,
      mock: result.mock,
    });
  }

  async findAllByUser(userId: string): Promise<SubmissionResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.userId, userId))
      .orderBy(challengeSubmissions.createdAt);
    return rows.map((row) => new SubmissionResponseDTO(row));
  }

  async findByChallenge(
    userId: string,
    challengeId: string,
  ): Promise<SubmissionResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.userId, userId),
          eq(challengeSubmissions.challengeId, challengeId),
        ),
      )
      .orderBy(challengeSubmissions.createdAt);
    return rows.map((row) => new SubmissionResponseDTO(row));
  }

  async findOne(id: string): Promise<SubmissionResponseDTO> {
    const [found] = await this.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Submission not found');
    return new SubmissionResponseDTO(found);
  }

  private async hasPassedBefore(
    userId: string,
    challengeId: string,
    exceptId: string,
  ) {
    const prior = await this.db
      .select({ id: challengeSubmissions.id })
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.userId, userId),
          eq(challengeSubmissions.challengeId, challengeId),
          eq(challengeSubmissions.passed, true),
        ),
      );
    return prior.some((s) => s.id !== exceptId);
  }

  private async grantXp(userId: string, amount: number): Promise<number> {
    if (amount <= 0) return 0;
    try {
      await firstValueFrom(
        this.userClient
          .send(USER_SERVICE.ACTIONS.ADD_XP, { userId, amount })
          .pipe(timeout(5000)),
      );
      return amount;
    } catch (error) {
      this.logger.error(
        `Failed to award challenge XP to ${userId}: ${error instanceof Error ? error.message : error}`,
      );
      return 0;
    }
  }
}
