import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePaymentRequestDTO, SUBSCRIPTION_SERVICE } from '@app/contracts';
import { rpcCall } from '../../utils/rpc-call';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Payments (Admin)')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(
    @Inject(SUBSCRIPTION_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  // Manually record a payment (admin reconciliation / offline payment).
  @Post()
  create(@Body() body: CreatePaymentRequestDTO) {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_CREATE,
      body,
    );
  }
}
