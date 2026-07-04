import { Controller } from '@nestjs/common';
import { UsageRpcService } from '../services/usage-rpc.service';
import { AI_SERVICE } from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('usage')
export class UsageRpcController {
  constructor(private readonly usageService: UsageRpcService) {}

  @MessagePattern(AI_SERVICE.ACTIONS.USAGE_FIND_BY_USER)
  findUsage(@Payload() payload: { userId: string }) {
    return this.usageService.findByUser(payload.userId);
  }

  @MessagePattern(AI_SERVICE.ACTIONS.USAGE_CHECK_CREDITS)
  checkCredits(@Payload() payload: { userId: string }) {
    return this.usageService.checkCredits(payload.userId);
  }
}
