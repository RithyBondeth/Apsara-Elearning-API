import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { PaymentResponseDTO } from './payment.dto';
import { PlanResponseDTO } from './plan.dto';
import { SubscriptionResponseDTO } from './subscription.dto';

/** Result of a successful subscribe: the new subscription, plan, and payment. */
export class SubscribeResponseDTO {
  constructor(partial: DtoInit<SubscribeResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: SubscriptionResponseDTO })
  subscription: SubscriptionResponseDTO;

  @ApiProperty({ type: PlanResponseDTO })
  plan: PlanResponseDTO;

  @ApiProperty({ type: PaymentResponseDTO })
  payment: PaymentResponseDTO;
}

/** The user's current active subscription joined with its plan. */
export class ActiveSubscriptionResponseDTO {
  constructor(partial: DtoInit<ActiveSubscriptionResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: SubscriptionResponseDTO })
  subscription: SubscriptionResponseDTO;

  @ApiProperty({ type: PlanResponseDTO })
  plan: PlanResponseDTO;
}

/** Whether the user is subscribed, with the active subscription/plan if so. */
export class SubscriptionCheckResponseDTO {
  constructor(partial: DtoInit<SubscriptionCheckResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: true })
  subscribed: boolean;

  @ApiPropertyOptional({ type: SubscriptionResponseDTO, nullable: true })
  subscription: SubscriptionResponseDTO | null;

  @ApiPropertyOptional({ type: PlanResponseDTO, nullable: true })
  plan: PlanResponseDTO | null;
}

export class CancelSubscriptionResponseDTO {
  constructor(partial: DtoInit<CancelSubscriptionResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 'Subscription cancelled' })
  message: string;

  @ApiProperty({ example: '7a2f8f3b-1d3b-5d2f-0f1b-2c3d4e5f6a7b' })
  id: string;

  @ApiProperty({ type: SubscriptionResponseDTO })
  subscription: SubscriptionResponseDTO;
}

export class PaymentWebhookResponseDTO {
  constructor(partial: DtoInit<PaymentWebhookResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: true })
  handled: boolean;
}
