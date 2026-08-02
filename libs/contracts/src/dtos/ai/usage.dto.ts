import { ApiProperty } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';

export class AiUsageResponseDTO {
  constructor(partial: DtoInit<AiUsageResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  userId: string;

  @ApiProperty({ example: 150 })
  tokensUsed: number;

  @ApiProperty({ example: 1000 })
  creditsRemaining: number;
}

export class CreditsResponseDTO {
  constructor(partial: DtoInit<CreditsResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 150 })
  used: number;

  @ApiProperty({ example: 1000000 })
  limit: number;

  @ApiProperty({ example: 999850 })
  remaining: number;

  @ApiProperty({ example: true })
  hasCredits: boolean;
}
