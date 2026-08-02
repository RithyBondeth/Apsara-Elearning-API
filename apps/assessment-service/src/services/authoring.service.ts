import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { quizzes } from '@app/database/schemas/course/quizzes/quiz.schema';
import { quizQuestions } from '@app/database/schemas/course/quizzes/quiz-question.schema';
import { quizOptions } from '@app/database/schemas/course/quizzes/quiz-option.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import {
  CreateOptionRequestDTO,
  CreateQuestionRequestDTO,
  CreateQuizRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  IAuthoringService,
  OptionResponseDTO,
  QuestionResponseDTO,
  QuizResponseDTO,
  ReorderResponseDTO,
  UpdateOptionRequestDTO,
  UpdateQuestionRequestDTO,
  UpdateQuizRequestDTO,
} from '@app/contracts';
import {
  CourseEntitlementService,
  RpcBadRequestException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class AuthoringService implements IAuthoringService {
  private readonly logger = new Logger(AuthoringService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: CourseEntitlementService,
  ) {}

  // ---- Quiz ----
  async createQuiz(
    lessonId: string,
    dto: CreateQuizRequestDTO,
  ): Promise<QuizResponseDTO> {
    const [lesson] = await this.db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new RpcBadRequestException('Lesson does not exist');

    const [created] = await this.db
      .insert(quizzes)
      .values({
        lessonId,
        title: dto.title,
        description: dto.description,
        xpReward: dto.xpReward,
      })
      .returning();
    this.logger.log(`Quiz created: ${created.id}`);
    return new QuizResponseDTO(created);
  }

  async findQuizzesByLesson(lessonId: string): Promise<QuizResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId));
    return rows.map((row) => new QuizResponseDTO(row));
  }

  async findPublicQuizzesByLesson(
    lessonId: string,
    userId: string,
  ): Promise<QuizResponseDTO[]> {
    await this.entitlements.assertCanReadLesson({ id: lessonId }, userId);
    return this.findQuizzesByLesson(lessonId);
  }

  async findQuiz(id: string): Promise<QuizResponseDTO> {
    const [found] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Quiz not found');
    return new QuizResponseDTO(found);
  }

  async updateQuiz(
    id: string,
    dto: UpdateQuizRequestDTO,
  ): Promise<QuizResponseDTO> {
    const [updated] = await this.db
      .update(quizzes)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(quizzes.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Quiz not found');
    return new QuizResponseDTO(updated);
  }

  async removeQuiz(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(quizzes)
      .where(eq(quizzes.id, id))
      .returning({ id: quizzes.id });
    if (!deleted) throw new RpcNotFoundException('Quiz not found');
    return new DeleteResponseDTO({ message: 'Quiz deleted successfully', id });
  }

  // ---- Question ----
  async createQuestion(
    quizId: string,
    dto: CreateQuestionRequestDTO,
  ): Promise<QuestionResponseDTO> {
    await this.findQuiz(quizId);
    const [created] = await this.db
      .insert(quizQuestions)
      .values({
        quizId,
        type: dto.type,
        question: dto.question,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        points: dto.points,
        order: dto.order,
      })
      .returning();
    return new QuestionResponseDTO(created);
  }

  async findQuestionsByQuiz(quizId: string): Promise<QuestionResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.order);
    return rows.map((row) => new QuestionResponseDTO(row));
  }

  async updateQuestion(
    id: string,
    dto: UpdateQuestionRequestDTO,
  ): Promise<QuestionResponseDTO> {
    const [updated] = await this.db
      .update(quizQuestions)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(quizQuestions.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Question not found');
    return new QuestionResponseDTO(updated);
  }

  async removeQuestion(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(quizQuestions)
      .where(eq(quizQuestions.id, id))
      .returning({ id: quizQuestions.id });
    if (!deleted) throw new RpcNotFoundException('Question not found');
    return new DeleteResponseDTO({
      message: 'Question deleted successfully',
      id,
    });
  }

  async reorderQuestions(orderedIds: string[]): Promise<ReorderResponseDTO> {
    // Sequential updates.
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db
        .update(quizQuestions)
        .set({ order: i, updatedAt: new Date() })
        .where(eq(quizQuestions.id, orderedIds[i]));
    }
    return new ReorderResponseDTO({
      message: 'Questions reordered',
      count: orderedIds.length,
    });
  }

  // ---- Option ----
  async createOption(
    questionId: string,
    dto: CreateOptionRequestDTO,
  ): Promise<OptionResponseDTO> {
    const [question] = await this.db
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(eq(quizQuestions.id, questionId))
      .limit(1);
    if (!question) throw new RpcBadRequestException('Question does not exist');

    const [created] = await this.db
      .insert(quizOptions)
      .values({
        questionId,
        answer: dto.answer,
        isCorrect: dto.isCorrect ?? false,
      })
      .returning();
    return new OptionResponseDTO(created);
  }

  async findOptionsByQuestion(
    questionId: string,
  ): Promise<OptionResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(quizOptions)
      .where(eq(quizOptions.questionId, questionId));
    return rows.map((row) => new OptionResponseDTO(row));
  }

  async updateOption(
    id: string,
    dto: UpdateOptionRequestDTO,
  ): Promise<OptionResponseDTO> {
    const [updated] = await this.db
      .update(quizOptions)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(quizOptions.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Option not found');
    return new OptionResponseDTO(updated);
  }

  async removeOption(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(quizOptions)
      .where(eq(quizOptions.id, id))
      .returning({ id: quizOptions.id });
    if (!deleted) throw new RpcNotFoundException('Option not found');
    return new DeleteResponseDTO({
      message: 'Option deleted successfully',
      id,
    });
  }
}
