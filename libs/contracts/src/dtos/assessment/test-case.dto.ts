import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTestCaseRequestDTO {
  @ApiPropertyOptional({ example: '2 3' })
  @IsString()
  @IsOptional()
  input?: string;

  @ApiProperty({ example: '5' })
  @IsString()
  @IsNotEmpty()
  expectedOutput: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateTestCaseRequestDTO extends PartialType(
  CreateTestCaseRequestDTO,
) {}
