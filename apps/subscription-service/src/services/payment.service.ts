import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { payments } from '@app/database/schemas/payment/payment.schema';
import {
  DRIZZLE,
  IPaymentService,
  PaymentResponseDTO,
  PaymentWebhookResponseDTO,
} from '@app/contracts';
import { RpcNotFoundException } from '@app/common';

export interface RecordPaymentInput {
  userId: string;
  subscriptionId?: string | null;
  amount: string;
  currency: string;
  provider: string;
  transactionId: string;
  status: string;
}

@Injectable()
export class PaymentService implements IPaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async record(input: RecordPaymentInput): Promise<PaymentResponseDTO> {
    const [created] = await this.db
      .insert(payments)
      .values({
        userId: input.userId,
        subscriptionId: input.subscriptionId ?? null,
        amount: input.amount,
        currency: input.currency,
        provider: input.provider,
        transactionId: input.transactionId,
        status: input.status,
      })
      .returning();
    return this.toDTO(created);
  }

  async findByUser(userId: string): Promise<PaymentResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(payments.createdAt);
    return rows.map((row) => this.toDTO(row));
  }

  async findOne(id: string): Promise<PaymentResponseDTO> {
    const [found] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Payment not found');
    return this.toDTO(found);
  }

  /** Provider callback — updates a payment's status by transactionId. */
  async webhook(payload: {
    transactionId?: string;
    status?: string;
  }): Promise<PaymentWebhookResponseDTO> {
    if (!payload?.transactionId || !payload?.status) {
      return new PaymentWebhookResponseDTO({ handled: false });
    }
    const [updated] = await this.db
      .update(payments)
      .set({ status: payload.status, updatedAt: new Date() })
      .where(eq(payments.transactionId, payload.transactionId))
      .returning({ id: payments.id });
    this.logger.log(
      `Webhook: tx ${payload.transactionId} → ${payload.status} (${updated ? 'matched' : 'no match'})`,
    );
    return new PaymentWebhookResponseDTO({ handled: !!updated });
  }

  /** Maps a payment row to its DTO, coercing the numeric `amount` column. */
  private toDTO(row: typeof payments.$inferSelect): PaymentResponseDTO {
    return new PaymentResponseDTO({ ...row, amount: Number(row.amount) });
  }
}
