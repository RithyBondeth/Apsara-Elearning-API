import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  SUBSCRIPTION_SERVICE,
  SubscribeRequestDTO,
  PlanResponseDTO,
  SubscriptionResponseDTO,
  PaymentResponseDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard, WebhookGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { rpcCall } from '../utils/rpc-call';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    @Inject(SUBSCRIPTION_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  // ---- Public: pricing ----
  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plans retrieved successfully',
    type: [PlanResponseDTO],
  })
  plans() {
    return rpcCall(this.client, SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ALL, {});
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get a specific plan by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan retrieved successfully',
    type: PlanResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Plan not found' })
  plan(@Param('id') id: string) {
    return rpcCall(this.client, SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ONE, {
      id,
    });
  }

  // ---- Provider callback — verified via shared secret (WebhookGuard) ----
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WebhookGuard)
  @ApiOperation({ summary: 'Payment provider webhook' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  webhook(@Body() body: { transactionId?: string; status?: string }) {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_WEBHOOK,
      body,
    );
  }

  // ---- Authenticated user actions ----
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription initiated successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribeRequestDTO,
  ) {
    return rpcCall(this.client, SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIBE, {
      userId,
      planId: dto.planId,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current active subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription retrieved successfully',
    type: SubscriptionResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  active(@CurrentUser('id') userId: string) {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_FIND_ACTIVE,
      { userId },
    );
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user has an active subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription status checked successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  check(@CurrentUser('id') userId: string) {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_CHECK,
      { userId },
    );
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user subscription history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'History retrieved successfully',
    type: [SubscriptionResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  history(@CurrentUser('id') userId: string) {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_FIND_BY_USER,
      { userId },
    );
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments retrieved successfully',
    type: [PaymentResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  payments(@CurrentUser('id') userId: string) {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_FIND_BY_USER,
      { userId },
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription cancelled successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_CANCEL,
      { userId, id },
    );
  }
}
