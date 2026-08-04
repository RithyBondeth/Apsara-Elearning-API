import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { LessonResponseDTO } from './lesson.dto';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/** Generic reorder payload: ids in their new order. */
export class ReorderRequestDTO {
  @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}

export class CreateModuleRequestDTO {
  @ApiProperty({ example: 'Getting Started' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Setup and the basics' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateModuleRequestDTO extends PartialType(
  CreateModuleRequestDTO,
) {}

export class ModuleResponseDTO extends CreateModuleRequestDTO {
  constructor(partial: DtoInit<ModuleResponseDTO> = {}) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  courseId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

/**
 * A module with its lessons already attached, both in `order`.
 *
 * Exists so a client can render a whole course outline in one request instead
 * of walking course → modules → lessons, which cost 1 + N round-trips per
 * course and made the catalog and dashboard fan out into hundreds of calls.
 */
export class ModuleWithLessonsResponseDTO extends ModuleResponseDTO {
  constructor(partial: DtoInit<ModuleWithLessonsResponseDTO> = {}) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ type: [LessonResponseDTO] })
  lessons: LessonResponseDTO[];
}
