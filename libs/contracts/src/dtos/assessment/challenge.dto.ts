import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateChallengeRequestDTO {
  @ApiProperty({ example: 'Sum two numbers' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Read two ints and print their sum.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'function solve(a, b) {\n  // your code\n}' })
  @IsString()
  @IsOptional()
  starterCode?: string;

  @ApiPropertyOptional({ example: 'console.log(a + b)' })
  @IsString()
  @IsOptional()
  solutionCode?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsInt()
  @Min(0)
  @IsOptional()
  xpReward?: number;
}

export class UpdateChallengeRequestDTO extends PartialType(
  CreateChallengeRequestDTO,
) {}

export class ChallengeResponseDTO extends CreateChallengeRequestDTO {
  constructor(partial: DtoInit<ChallengeResponseDTO> = {}) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
