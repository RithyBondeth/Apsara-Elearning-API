import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateQuizRequestDTO {
  @ApiProperty({ example: 'Variables Quiz' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Test your knowledge of variables' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateQuizRequestDTO extends PartialType(CreateQuizRequestDTO) {}
