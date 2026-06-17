import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
