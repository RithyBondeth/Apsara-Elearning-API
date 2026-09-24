import { Controller, Inject } from '@nestjs/common';
import { I_USAGE_SERVICE } from '@app/contracts';
import type { IUsageRpcController, IUsageService } from '@app/contracts';
import {
  AI_SERVICE,
  USAGE_DEFAULT_LIMIT,
  USAGE_MAX_LIMIT,
} from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('usage')
export class UsageController implements IUsageRpcController {
  constructor(
    @Inject(I_USAGE_SERVICE) private readonly usageService: IUsageService,
  ) {}

  @MessagePattern(AI_SERVICE.ACTIONS.USAGE_FIND_BY_USER)
  findUsage(@Payload() payload: { userId: string; limit?: number }) {
    // Validated at the gateway; clamp here too since any service can call it.
    const requested = Number(payload.limit ?? USAGE_DEFAULT_LIMIT);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), USAGE_MAX_LIMIT)
      : USAGE_DEFAULT_LIMIT;
    return this.usageService.findByUser(payload.userId, limit);
  }

  @MessagePattern(AI_SERVICE.ACTIONS.USAGE_CHECK_CREDITS)
  checkCredits(@Payload() payload: { userId: string }) {
    return this.usageService.checkCredits(payload.userId);
  }
}
