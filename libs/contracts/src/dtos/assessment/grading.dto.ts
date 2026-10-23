import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { DtoInit } from '../../types/dto-init';

export const GRADING_STATUSES = ['pending', 'graded'] as const;
export type GradingStatus = (typeof GRADING_STATUSES)[number];

/** The admin grading queue: answers the auto-grader couldn't score. */
export class GradingQueryDTO {
  @ApiPropertyOptional({ enum: GRADING_STATUSES, default: 'pending' })
  @IsOptional()
  @IsIn(GRADING_STATUSES)
  status?: GradingStatus;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class GradeAnswerRequestDTO {
  @ApiProperty({
    example: 2,
    description: "Whole points, from 0 to the question's points",
  })
  @IsInt()
  @Min(0)
  points!: number;

  @ApiPropertyOptional({
    example: 'Good definition, but name both reactants.',
    description: 'Shown to the learner with their grade',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}

/** One answer in the grading queue, with what a grader needs to judge it. */
export class GradingItemResponseDTO {
  constructor(partial: DtoInit<GradingItemResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty() answerId: string;
  @ApiProperty() attemptId: string;
  @ApiProperty() submittedAt: Date;
  @ApiPropertyOptional({ nullable: true }) learnerName: string | null;
  @ApiPropertyOptional({ nullable: true }) learnerEmail: string | null;
  @ApiPropertyOptional({ nullable: true }) courseTitle: string | null;
  @ApiPropertyOptional({ nullable: true }) lessonTitle: string | null;
  @ApiPropertyOptional({ nullable: true }) quizTitle: string | null;
  @ApiProperty() question: string;
  @ApiPropertyOptional({ nullable: true }) explanation: string | null;
  @ApiProperty({ example: 2 }) maxPoints: number;
  @ApiPropertyOptional({
    nullable: true,
    description: "The learner's written answer",
  })
  answerText: string | null;
  @ApiProperty({ enum: GRADING_STATUSES }) status: GradingStatus;
  @ApiProperty({ example: 0 }) pointsAwarded: number;
  @ApiPropertyOptional({ nullable: true }) feedback: string | null;
  @ApiPropertyOptional({ nullable: true }) reviewedAt: Date | null;
}

/** The answer after grading, plus the attempt's new standing. */
export class GradeAnswerResponseDTO {
  constructor(partial: DtoInit<GradeAnswerResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: GradingItemResponseDTO })
  item: GradingItemResponseDTO;

  @ApiProperty({ example: 80 }) attemptScore: number;
  @ApiProperty({ example: true }) attemptPassed: boolean;
  @ApiProperty({
    example: 0,
    description: 'Answers on the attempt still waiting for a grade',
  })
  stillPending: number;

  @ApiProperty({
    example: 25,
    description: 'First-pass XP this grade unlocked (0 if none)',
  })
  xpAwarded: number;
}
