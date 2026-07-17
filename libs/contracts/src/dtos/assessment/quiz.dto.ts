import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateQuizRequestDTO {
  @ApiProperty({ example: 'Variables Quiz' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Test your knowledge of variables' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 25, description: 'XP granted on first pass' })
  @IsInt()
  @Min(0)
  @IsOptional()
  xpReward?: number;
}

export class UpdateQuizRequestDTO extends PartialType(CreateQuizRequestDTO) {}

export class QuizResponseDTO extends CreateQuizRequestDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
