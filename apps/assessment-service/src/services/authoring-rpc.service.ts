import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { quizzes } from '@app/database/schemas/course/quizzes/quiz.schema';
import { quizQuestions } from '@app/database/schemas/course/quizzes/quiz-question.schema';
import { quizOptions } from '@app/database/schemas/course/quizzes/quiz-option.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import {
  CreateOptionRequestDTO,
  CreateQuestionRequestDTO,
  CreateQuizRequestDTO,
  DRIZZLE,
  UpdateOptionRequestDTO,
  UpdateQuestionRequestDTO,
  UpdateQuizRequestDTO,
} from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';

@Injectable()
export class AuthoringRpcService {
  private readonly logger = new Logger(AuthoringRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  // ---- Quiz ----
  async createQuiz(lessonId: string, dto: CreateQuizRequestDTO) {
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
    return created;
  }

  findQuizzesByLesson(lessonId: string) {
    return this.db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
  }

  async findQuiz(id: string) {
    const [found] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Quiz not found');
    return found;
  }

  async updateQuiz(id: string, dto: UpdateQuizRequestDTO) {
    const [updated] = await this.db
      .update(quizzes)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(quizzes.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Quiz not found');
    return updated;
  }

  async removeQuiz(id: string) {
    const [deleted] = await this.db
      .delete(quizzes)
      .where(eq(quizzes.id, id))
      .returning({ id: quizzes.id });
    if (!deleted) throw new RpcNotFoundException('Quiz not found');
    return { message: 'Quiz deleted successfully', id };
  }

  // ---- Question ----
  async createQuestion(quizId: string, dto: CreateQuestionRequestDTO) {
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
    return created;
  }

  findQuestionsByQuiz(quizId: string) {
    return this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.order);
  }

  async updateQuestion(id: string, dto: UpdateQuestionRequestDTO) {
    const [updated] = await this.db
      .update(quizQuestions)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(quizQuestions.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Question not found');
    return updated;
  }

  async removeQuestion(id: string) {
    const [deleted] = await this.db
      .delete(quizQuestions)
      .where(eq(quizQuestions.id, id))
      .returning({ id: quizQuestions.id });
    if (!deleted) throw new RpcNotFoundException('Question not found');
    return { message: 'Question deleted successfully', id };
  }

  async reorderQuestions(orderedIds: string[]) {
    // Sequential updates (neon-http has no interactive transactions).
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db
        .update(quizQuestions)
        .set({ order: i, updatedAt: new Date() })
        .where(eq(quizQuestions.id, orderedIds[i]));
    }
    return { message: 'Questions reordered', count: orderedIds.length };
  }

  // ---- Option ----
  async createOption(questionId: string, dto: CreateOptionRequestDTO) {
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
    return created;
  }

  findOptionsByQuestion(questionId: string) {
    return this.db
      .select()
      .from(quizOptions)
      .where(eq(quizOptions.questionId, questionId));
  }

  async updateOption(id: string, dto: UpdateOptionRequestDTO) {
    const [updated] = await this.db
      .update(quizOptions)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(quizOptions.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Option not found');
    return updated;
  }

  async removeOption(id: string) {
    const [deleted] = await this.db
      .delete(quizOptions)
      .where(eq(quizOptions.id, id))
      .returning({ id: quizOptions.id });
    if (!deleted) throw new RpcNotFoundException('Option not found');
    return { message: 'Option deleted successfully', id };
  }
}
