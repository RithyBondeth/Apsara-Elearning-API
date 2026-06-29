import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class ConversationResponseDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiPropertyOptional({ example: 'Help with JavaScript loops' })
  title?: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  userId: string;

  @ApiPropertyOptional()
  courseId?: string;

  @ApiPropertyOptional()
  lessonId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
