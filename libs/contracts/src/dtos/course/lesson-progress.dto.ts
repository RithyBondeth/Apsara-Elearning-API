import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LessonProgressResponseDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  userId: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  lessonId: string;

  @ApiProperty({ example: true })
  completed: boolean;

  @ApiPropertyOptional({ example: '2023-01-10T00:00:00.000Z' })
  completedAt?: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
