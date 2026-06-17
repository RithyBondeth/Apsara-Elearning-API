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
import { SUBSCRIPTION_SERVICE, SubscribeRequestDTO } from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../utils/rpc-call';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    @Inject(SUBSCRIPTION_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  // ---- Public: pricing ----
  @Get('plans')
  plans() {
    return rpcCall(this.client, SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ALL, {});
  }

  @Get('plans/:id')
  plan(@Param('id') id: string) {
    return rpcCall(this.client, SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ONE, {
      id,
    });
  }

  // ---- Provider callback (no auth — verify signature in a real integration) ----
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_CANCEL,
      { userId, id },
    );
  }
}
