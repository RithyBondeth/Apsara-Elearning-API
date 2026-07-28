import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { PlanResponseDTO } from './plan.dto';
import { SubscriptionResponseDTO } from './subscription.dto';

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

/** URL for a Stripe-hosted subscription Checkout Session. */
export class CheckoutSessionResponseDTO {
  constructor(partial: DtoInit<CheckoutSessionResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 'cs_test_...' })
  sessionId: string;

  @ApiProperty({ example: 'https://checkout.stripe.com/c/pay/...' })
  url: string;
}

/** URL for the Stripe-hosted customer billing portal. */
export class BillingPortalResponseDTO {
  constructor(partial: DtoInit<BillingPortalResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 'https://billing.stripe.com/p/session/...' })
  url: string;
}
