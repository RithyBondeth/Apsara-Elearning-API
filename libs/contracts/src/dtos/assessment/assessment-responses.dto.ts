import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { AttemptResponseDTO } from './attempt.dto';
import { QuizResponseDTO } from './quiz.dto';
import type { QuestionType } from './question.dto';
import { SubmissionResponseDTO } from './submission.dto';

/**
 * Response DTOs for assessment-service. The renderable quiz payloads carry
 * inherently dynamic, type-specific JSON (`correctAnswer`, `answerData`,
 * `prompt`) which stays typed as `Record<string, unknown>`.
 */

export class QuestionResponseDTO {
  constructor(partial: DtoInit<QuestionResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  quizId: string;

  @ApiProperty({ example: 'multiple_choice' })
  type: QuestionType;

  @ApiProperty({ example: 'What keyword declares a constant in JS?' })
  question: string;

  @ApiPropertyOptional({ type: Object, nullable: true })
  correctAnswer?: unknown;

  @ApiPropertyOptional({ example: '`const` creates a read-only binding.' })
  explanation?: string;

  @ApiProperty({ example: 1 })
  points: number;

  @ApiProperty({ example: 0 })
  order: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class OptionResponseDTO {
  constructor(partial: DtoInit<OptionResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  questionId: string;

  @ApiProperty({ example: 'const' })
  answer: string;

  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class ReorderResponseDTO {
  constructor(partial: DtoInit<ReorderResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 'Questions reordered' })
  message: string;

  @ApiProperty({ example: 5 })
  count: number;
}

// ---- Attempt start (answer keys stripped) ----

export class StartAttemptOptionDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: 'const' })
  answer: string;
}

export class StartAttemptQuestionDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: 'multiple_choice' })
  type: string;

  @ApiProperty({ example: 'What keyword declares a constant in JS?' })
  question: string;

  @ApiProperty({ example: 1 })
  points: number;

  @ApiProperty({ example: 0 })
  order: number;

  @ApiProperty({ type: [StartAttemptOptionDTO] })
  options: StartAttemptOptionDTO[];

  @ApiPropertyOptional({ type: Object, nullable: true })
  prompt: Record<string, unknown> | null;
}

export class StartAttemptResponseDTO {
  constructor(partial: DtoInit<StartAttemptResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: AttemptResponseDTO })
  attempt: AttemptResponseDTO;

  @ApiProperty({ type: QuizResponseDTO })
  quiz: QuizResponseDTO;

  @ApiProperty({ type: [StartAttemptQuestionDTO] })
  questions: StartAttemptQuestionDTO[];
}

// ---- Attempt submit (graded review) ----

export class AttemptReviewOptionDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: 'const' })
  answer: string;

  @ApiProperty({ example: true })
  isCorrect: boolean;
}

export class AttemptReviewAnswerDTO {
  @ApiPropertyOptional({ nullable: true })
  selectedOptionId: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  answerData: Record<string, unknown> | null;
}

export class AttemptReviewItemDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  questionId: string;

  @ApiProperty({ example: 'multiple_choice' })
  type: string;

  @ApiProperty({ example: 'What keyword declares a constant in JS?' })
  question: string;

  @ApiPropertyOptional({ nullable: true })
  explanation: string | null;

  @ApiProperty({ example: 1 })
  points: number;

  @ApiProperty({ type: [AttemptReviewOptionDTO] })
  options: AttemptReviewOptionDTO[];

  @ApiPropertyOptional({ type: Object, nullable: true })
  correctAnswer: unknown;

  @ApiPropertyOptional({ type: AttemptReviewAnswerDTO, nullable: true })
  yourAnswer: AttemptReviewAnswerDTO | null;

  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: false })
  requiresReview: boolean;
}

export class SubmitAttemptResponseDTO {
  constructor(partial: DtoInit<SubmitAttemptResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: AttemptResponseDTO })
  attempt: AttemptResponseDTO;

  @ApiProperty({ example: 85 })
  score: number;

  @ApiProperty({ example: true })
  passed: boolean;

  @ApiProperty({ example: 4 })
  correctAnswers: number;

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 8 })
  earnedPoints: number;

  @ApiProperty({ example: 10 })
  totalPoints: number;

  @ApiProperty({ example: 0 })
  needsReview: number;

  @ApiProperty({ example: 25 })
  xpAwarded: number;

  @ApiProperty({ type: [AttemptReviewItemDTO] })
  review: AttemptReviewItemDTO[];
}

// ---- Challenge submission (graded) ----

export class SubmissionResultResponseDTO {
  constructor(partial: DtoInit<SubmissionResultResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: SubmissionResponseDTO })
  submission: SubmissionResponseDTO;

  @ApiProperty({ example: true })
  passed: boolean;

  @ApiProperty({ example: 100 })
  score: number;

  @ApiProperty({ example: 5 })
  testCasesPassed: number;

  @ApiProperty({ example: 5 })
  testCasesTotal: number;

  @ApiProperty({ example: 50 })
  xpAwarded: number;

  @ApiProperty({
    example: true,
    description: 'True when graded by the mock runner',
  })
  mock: boolean;
}
