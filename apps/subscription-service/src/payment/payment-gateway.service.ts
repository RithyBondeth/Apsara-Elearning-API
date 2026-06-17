import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface ChargeResult {
  provider: string;
  transactionId: string;
  status: 'succeeded' | 'failed';
}

/**
 * Mock payment gateway — auto-approves charges. Swap this implementation for a
 * real provider (e.g. Stripe) without touching the subscription logic.
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  readonly provider = 'mock';

  async charge(amount: string, currency = 'USD'): Promise<ChargeResult> {
    this.logger.log(`[mock] charging ${amount} ${currency}`);
    return {
      provider: this.provider,
      transactionId: `mock_${randomUUID()}`,
      status: 'succeeded',
    };
  }
}
