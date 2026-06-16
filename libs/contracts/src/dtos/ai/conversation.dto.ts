import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConversationRequestDTO {
  @ApiPropertyOptional({ example: 'Help with JavaScript loops' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ example: '7a2f8f3b-1d3b-5d2f-0g1b-2c3d4e5f6a7b' })
  @IsUUID()
  @IsOptional()
  lessonId?: string;
}
