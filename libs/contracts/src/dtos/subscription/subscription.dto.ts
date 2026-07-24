import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { PlanResponseDTO } from './plan.dto';

export class SubscriptionResponseDTO {
  constructor(partial: DtoInit<SubscriptionResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '7a2f8f3b-1d3b-5d2f-0g1b-2c3d4e5f6a7b' })
  id: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  userId: string;

  @ApiProperty({ example: '3c4e5f6d-1a2b-3c4d-5e6f-7a8b9c0d1e2f' })
  planId: string;

  @ApiProperty({ example: 'stripe' })
  provider: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiPropertyOptional()
  currentPeriodStart?: Date;

  @ApiPropertyOptional()
  currentPeriodEnd?: Date;

  @ApiPropertyOptional()
  cancelAtPeriodEnd?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => PlanResponseDTO })
  plan?: PlanResponseDTO;
}
