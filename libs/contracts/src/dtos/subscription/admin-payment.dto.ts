import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { DtoInit } from '../../types/dto-init';

export const ADMIN_PAYMENT_FILTERS = [
  'succeeded',
  'failed',
  'refunded',
] as const;
export type AdminPaymentFilter = (typeof ADMIN_PAYMENT_FILTERS)[number];

/** Admin search over recorded payments. */
export class AdminPaymentQueryDTO {
  @ApiPropertyOptional({
    description:
      "Matches the learner's name or email, or the transaction/invoice id",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    enum: ADMIN_PAYMENT_FILTERS,
    description: "'refunded' includes partial refunds",
  })
  @IsOptional()
  @IsIn(ADMIN_PAYMENT_FILTERS)
  filter?: AdminPaymentFilter;

  @ApiPropertyOptional({ description: "Only this learner's payments" })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

/** A payment as the admin console lists it — with who paid and for what. */
export class AdminPaymentDTO {
  constructor(partial: DtoInit<AdminPaymentDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty() id: string;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Null once the paying account has been deleted',
  })
  userId: string | null;
  @ApiPropertyOptional({ nullable: true }) learnerName: string | null;
  @ApiPropertyOptional({ nullable: true }) learnerEmail: string | null;
  @ApiPropertyOptional({ nullable: true }) planName: string | null;
  @ApiProperty({ example: 9.99 }) amount: number;
  @ApiProperty({ example: 'USD' }) currency: string;
  @ApiProperty({ example: 'stripe' }) provider: string;
  @ApiProperty({ example: 'succeeded' }) status: string;
  @ApiProperty({ example: 0 }) refundedAmount: number;
  @ApiPropertyOptional({
    nullable: true,
    example: 'partially_refunded',
    description: "null | 'partially_refunded' | 'refunded'",
  })
  refundStatus: string | null;
  @ApiPropertyOptional({ nullable: true }) transactionId: string | null;
  @ApiPropertyOptional({ nullable: true }) providerInvoiceId: string | null;
  @ApiProperty() createdAt: Date;
}

export class AdminPaymentRefundDTO {
  constructor(partial: DtoInit<AdminPaymentRefundDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty() id: string;
  @ApiProperty({ example: 4.99 }) amount: number;
  @ApiProperty({ example: 'USD' }) currency: string;
  @ApiProperty({ example: 'succeeded' }) status: string;
  @ApiPropertyOptional({ nullable: true }) reason: string | null;
  @ApiPropertyOptional({ nullable: true }) failureReason: string | null;
  @ApiProperty() providerRefundId: string;
  @ApiProperty() createdAt: Date;
}

export class AdminPaymentDetailDTO extends AdminPaymentDTO {
  constructor(partial: DtoInit<AdminPaymentDetailDTO> = {}) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ type: [AdminPaymentRefundDTO] })
  refunds: AdminPaymentRefundDTO[];
}
