import { ApiProperty } from '@nestjs/swagger';

export class AiUsageResponseDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  userId: string;

  @ApiProperty({ example: 150 })
  tokensUsed: number;

  @ApiProperty({ example: 1000 })
  creditsRemaining: number;
}
