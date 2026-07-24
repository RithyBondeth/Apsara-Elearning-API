import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const BILLING_PERIODS = ['monthly', 'yearly', 'lifetime'] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export class CreatePlanRequestDTO {
  @ApiProperty({ example: 'Pro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'pro' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Unlimited courses + AI tutor' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 9.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ enum: BILLING_PERIODS, example: 'monthly' })
  @IsIn(BILLING_PERIODS)
  @IsOptional()
  billingPeriod?: BillingPeriod;

  @ApiPropertyOptional({ example: 1000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  aiCredits?: number;
}

export class UpdatePlanRequestDTO extends PartialType(CreatePlanRequestDTO) {}

export class PlanResponseDTO {
  constructor(partial: DtoInit<PlanResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '3c4e5f6d-1a2b-3c4d-5e6f-7a8b9c0d1e2f' })
  id: string;

  @ApiProperty({ example: 'Pro' })
  name: string;

  @ApiProperty({ example: 'pro' })
  slug: string;

  @ApiPropertyOptional({ example: 'Unlimited courses + AI tutor' })
  description?: string;

  @ApiProperty({ example: 9.99 })
  price: number;

  @ApiPropertyOptional({ enum: BILLING_PERIODS, example: 'monthly' })
  billingPeriod?: BillingPeriod;

  @ApiPropertyOptional({ example: 1000 })
  aiCredits?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
