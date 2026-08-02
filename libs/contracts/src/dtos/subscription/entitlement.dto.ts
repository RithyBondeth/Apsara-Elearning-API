import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { DtoInit } from '../../types/dto-init';

export const ENTITLEMENTS = [
  'courses:premium',
  'ai:tutor',
  'certificates',
] as const;
export type EntitlementKey = (typeof ENTITLEMENTS)[number];

export const ENTITLEMENT_EFFECTS = ['allow', 'deny'] as const;
export type EntitlementEffect = (typeof ENTITLEMENT_EFFECTS)[number];

export class CreateEntitlementGrantRequestDTO {
  @ApiProperty({ enum: ENTITLEMENTS, example: 'ai:tutor' })
  @IsIn(ENTITLEMENTS)
  entitlement: EntitlementKey;

  @ApiPropertyOptional({ enum: ENTITLEMENT_EFFECTS, default: 'allow' })
  @IsIn(ENTITLEMENT_EFFECTS)
  @IsOptional()
  effect?: EntitlementEffect;

  @ApiPropertyOptional({
    description: 'ISO timestamp; defaults to immediately',
  })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp; omit for no expiry' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({ example: 'Customer support courtesy access' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class EntitlementGrantResponseDTO {
  constructor(partial: DtoInit<EntitlementGrantResponseDTO> = {}) {
    Object.assign(this, partial);
  }
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty({ enum: ENTITLEMENTS }) entitlement: EntitlementKey;
  @ApiProperty({ enum: ENTITLEMENT_EFFECTS }) effect: EntitlementEffect;
  @ApiPropertyOptional() startsAt?: Date | null;
  @ApiPropertyOptional() expiresAt?: Date | null;
  @ApiProperty() reason: string;
  @ApiPropertyOptional() grantedBy?: string | null;
  @ApiPropertyOptional() revokedAt?: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class ResolvedEntitlementDTO {
  constructor(partial: DtoInit<ResolvedEntitlementDTO> = {}) {
    Object.assign(this, partial);
  }
  @ApiProperty({ enum: ENTITLEMENTS }) entitlement: EntitlementKey;
  @ApiProperty() granted: boolean;
  @ApiPropertyOptional({ enum: ['administrative', 'plan', 'none'] })
  source: 'administrative' | 'plan' | 'none';
  @ApiPropertyOptional() validUntil?: Date | null;
}
