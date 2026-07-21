import { Controller, Inject } from '@nestjs/common';
import { I_USAGE_SERVICE } from '@app/contracts';
import type { IUsageRpcController, IUsageService } from '@app/contracts';
import { AI_SERVICE } from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('usage')
export class UsageController implements IUsageRpcController {
  constructor(@Inject(I_USAGE_SERVICE) private readonly usageService: IUsageService) {}

  @MessagePattern(AI_SERVICE.ACTIONS.USAGE_FIND_BY_USER)
  findUsage(@Payload() payload: { userId: string }) {
    return this.usageService.findByUser(payload.userId);
  }

  @MessagePattern(AI_SERVICE.ACTIONS.USAGE_CHECK_CREDITS)
  checkCredits(@Payload() payload: { userId: string }) {
    return this.usageService.checkCredits(payload.userId);
  }
}
