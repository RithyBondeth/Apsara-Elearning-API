import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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
