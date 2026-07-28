import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/** Manually record a payment (e.g. admin reconciliation / offline payment). */
export class CreatePaymentRequestDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: '7a2f8f3b-1d3b-5d2f-0g1b-2c3d4e5f6a7b' })
  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @ApiProperty({ example: 9.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 'stripe' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'pi_3Xyz...' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ example: 'succeeded' })
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class PaymentResponseDTO {
  constructor(partial: DtoInit<PaymentResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d' })
  id: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  userId: string;

  @ApiPropertyOptional({ example: '7a2f8f3b-1d3b-5d2f-0g1b-2c3d4e5f6a7b' })
  subscriptionId?: string;

  @ApiProperty({ example: 9.99 })
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  currency?: string;

  @ApiProperty({ example: 'stripe' })
  provider: string;

  @ApiProperty({ example: 'pi_3Xyz...' })
  transactionId: string;

  @ApiPropertyOptional({ example: 'in_...' })
  providerInvoiceId?: string;

  @ApiPropertyOptional({ example: 'pi_...' })
  providerPaymentIntentId?: string;

  @ApiPropertyOptional({ example: 'ch_...' })
  providerChargeId?: string;

  @ApiProperty({ example: 'succeeded' })
  status: string;

  @ApiProperty({ example: 0 })
  refundedAmount: number;

  @ApiPropertyOptional({ example: 'partially_refunded' })
  refundStatus?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
