import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  USER_SERVICE,
  CreateBadgeRequestDTO,
  UpdateBadgeRequestDTO,
  I_BADGE_SERVICE,
} from '@app/contracts';
import type { IBadgeService, IBadgeRpcController } from '@app/contracts';
import { idOf, splitUpdate } from '../utils/payload';

@Controller()
export class BadgeController implements IBadgeRpcController {
  constructor(
    @Inject(I_BADGE_SERVICE) private readonly badgeRpcService: IBadgeService,
  ) {}

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_CREATE)
  create(@Payload() dto: CreateBadgeRequestDTO) {
    return this.badgeRpcService.create(dto);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_FIND_ALL)
  findAll() {
    return this.badgeRpcService.findAll();
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.badgeRpcService.findOne(idOf(payload));
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_UPDATE)
  update(@Payload() payload: UpdateBadgeRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.badgeRpcService.update(id, data);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.badgeRpcService.remove(idOf(payload));
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_AWARD)
  award(@Payload() payload: { userId: string; badgeId: string }) {
    return this.badgeRpcService.award(payload.userId, payload.badgeId);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_FIND_BY_USER)
  findByUser(@Payload() payload: string | { userId: string }) {
    const userId = typeof payload === 'string' ? payload : payload.userId;
    return this.badgeRpcService.findByUser(userId);
  }
}
