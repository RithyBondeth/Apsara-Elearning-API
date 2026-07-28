import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ActiveSubscriptionResponseDTO,
  BillingPortalResponseDTO,
  CancelSubscriptionResponseDTO,
  CheckoutSessionResponseDTO,
  ISubscriptionHttpController,
  PaymentResponseDTO,
  PaymentWebhookResponseDTO,
  PlanResponseDTO,
  SUBSCRIPTION_SERVICE,
  SubscribeRequestDTO,
  SubscriptionCheckResponseDTO,
  SubscriptionResponseDTO,
  ResolvedEntitlementDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { rpcCall } from '@app/common';
import { Request } from 'express';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController implements ISubscriptionHttpController {
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
  plans(): Promise<PlanResponseDTO[]> {
    return rpcCall<PlanResponseDTO[]>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ALL,
      {},
    );
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get a specific plan by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan retrieved successfully',
    type: PlanResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Plan not found' })
  plan(@Param('id') id: string): Promise<PlanResponseDTO> {
    return rpcCall<PlanResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ONE,
      { id },
    );
  }

  // Stripe requires the exact raw request bytes for signature verification.
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Signed Stripe webhook' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
    type: PaymentWebhookResponseDTO,
  })
  webhook(
    @Req() request: RawBodyRequest<Request> | Buffer,
    @Headers('stripe-signature') signature: string,
  ): Promise<PaymentWebhookResponseDTO> {
    const rawBody = Buffer.isBuffer(request) ? request : request.rawBody;
    if (!rawBody || !signature) {
      throw new BadRequestException('Missing Stripe webhook signature');
    }
    return rpcCall<PaymentWebhookResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_WEBHOOK,
      { rawBody: rawBody.toString('base64'), signature },
    );
  }

  // ---- Authenticated user actions ----
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stripe Checkout Session created',
    type: CheckoutSessionResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  createCheckout(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribeRequestDTO,
  ): Promise<CheckoutSessionResponseDTO> {
    return rpcCall<CheckoutSessionResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.CHECKOUT_CREATE,
      { userId, planId: dto.planId },
    );
  }

  @Post('billing-portal')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe customer portal session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Billing portal session created',
    type: BillingPortalResponseDTO,
  })
  createBillingPortal(
    @CurrentUser('id') userId: string,
  ): Promise<BillingPortalResponseDTO> {
    return rpcCall<BillingPortalResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.BILLING_PORTAL_CREATE,
      { userId },
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current active subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription retrieved successfully',
    type: ActiveSubscriptionResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  active(
    @CurrentUser('id') userId: string,
  ): Promise<ActiveSubscriptionResponseDTO | null> {
    return rpcCall<ActiveSubscriptionResponseDTO | null>(
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
    type: SubscriptionCheckResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  check(
    @CurrentUser('id') userId: string,
  ): Promise<SubscriptionCheckResponseDTO> {
    return rpcCall<SubscriptionCheckResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_CHECK,
      { userId },
    );
  }

  @Get('entitlements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current named entitlements' })
  @ApiResponse({ status: HttpStatus.OK, type: [ResolvedEntitlementDTO] })
  entitlements(
    @CurrentUser('id') userId: string,
  ): Promise<ResolvedEntitlementDTO[]> {
    return rpcCall<ResolvedEntitlementDTO[]>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.ENTITLEMENT_RESOLVE,
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
  history(
    @CurrentUser('id') userId: string,
  ): Promise<SubscriptionResponseDTO[]> {
    return rpcCall<SubscriptionResponseDTO[]>(
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
  payments(@CurrentUser('id') userId: string): Promise<PaymentResponseDTO[]> {
    return rpcCall<PaymentResponseDTO[]>(
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
    type: CancelSubscriptionResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<CancelSubscriptionResponseDTO> {
    return rpcCall<CancelSubscriptionResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_CANCEL,
      { userId, id },
    );
  }
}
