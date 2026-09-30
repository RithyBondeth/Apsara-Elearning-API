import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AdminPaymentDetailDTO,
  AdminPaymentDTO,
  AdminPaymentQueryDTO,
  CreatePaymentRequestDTO,
  IAdminPaymentController,
  PaymentResponseDTO,
  SUBSCRIPTION_SERVICE,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Payments (Admin)')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController implements IAdminPaymentController {
  constructor(
    @Inject(SUBSCRIPTION_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Search payments by learner or transaction id; filter by status or refunds',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [AdminPaymentDTO] })
  findAll(@Query() query: AdminPaymentQueryDTO): Promise<AdminPaymentDTO[]> {
    return rpcCall<AdminPaymentDTO[]>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_ADMIN_LIST,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'One payment with its refund history' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPaymentDetailDTO })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminPaymentDetailDTO> {
    return rpcCall<AdminPaymentDetailDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_ADMIN_FIND_ONE,
      { id },
    );
  }

  // Manually record a payment (admin reconciliation / offline payment).
  @Post()
  create(@Body() body: CreatePaymentRequestDTO): Promise<PaymentResponseDTO> {
    return rpcCall<PaymentResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_CREATE,
      body,
    );
  }
}
