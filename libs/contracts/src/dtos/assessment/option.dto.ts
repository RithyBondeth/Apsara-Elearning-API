import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOptionRequestDTO {
  @ApiProperty({ example: 'const' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;
}

export class UpdateOptionRequestDTO extends PartialType(
  CreateOptionRequestDTO,
) {}
