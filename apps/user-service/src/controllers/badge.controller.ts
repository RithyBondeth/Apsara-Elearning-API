import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  USER_SERVICE,
  CreateBadgeRequestDTO,
  UpdateBadgeRequestDTO,
  I_BADGE_SERVICE,
} from '@app/contracts';
import type { IBadgeService, IBadgeRpcController } from '@app/contracts';
import { idOf, splitUpdate } from '@app/utils';

@Controller()
export class BadgeController implements IBadgeRpcController {
  constructor(
    @Inject(I_BADGE_SERVICE) private readonly badgeService: IBadgeService,
  ) {}

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_CREATE)
  create(@Payload() dto: CreateBadgeRequestDTO) {
    return this.badgeService.create(dto);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_FIND_ALL)
  findAll() {
    return this.badgeService.findAll();
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.badgeService.findOne(idOf(payload));
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_UPDATE)
  update(@Payload() payload: UpdateBadgeRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.badgeService.update(id, data);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.badgeService.remove(idOf(payload));
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_AWARD)
  award(@Payload() payload: { userId: string; badgeId: string }) {
    return this.badgeService.award(payload.userId, payload.badgeId);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.BADGE_FIND_BY_USER)
  findByUser(@Payload() payload: string | { userId: string }) {
    const userId = typeof payload === 'string' ? payload : payload.userId;
    return this.badgeService.findByUser(userId);
  }
}
