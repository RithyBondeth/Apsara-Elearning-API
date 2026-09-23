import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateNotificationDTO,
  I_NOTIFICATION_SERVICE,
  NOTIFICATIONS_DEFAULT_LIMIT,
  NOTIFICATIONS_MAX_LIMIT,
  USER_SERVICE,
} from '@app/contracts';
import type {
  INotificationRpcController,
  INotificationService,
} from '@app/contracts';

@Controller()
export class NotificationController implements INotificationRpcController {
  constructor(
    @Inject(I_NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  /** Raised by any service when something worth telling the learner happens. */
  @MessagePattern(USER_SERVICE.ACTIONS.NOTIFICATION_CREATE)
  create(@Payload() dto: CreateNotificationDTO) {
    return this.notificationService.create(dto);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.NOTIFICATION_FIND_BY_USER)
  findByUser(
    @Payload() payload: { userId: string; limit?: number; unreadOnly?: boolean },
  ) {
    // Validated at the gateway, but the action is callable over RPC — clamp.
    const requested = Number(payload.limit ?? NOTIFICATIONS_DEFAULT_LIMIT);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), NOTIFICATIONS_MAX_LIMIT)
      : NOTIFICATIONS_DEFAULT_LIMIT;
    return this.notificationService.findByUser(
      payload.userId,
      limit,
      payload.unreadOnly === true,
    );
  }

  @MessagePattern(USER_SERVICE.ACTIONS.NOTIFICATION_MARK_READ)
  markRead(@Payload() payload: { userId: string; id: string }) {
    return this.notificationService.markRead(payload.userId, payload.id);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.NOTIFICATION_MARK_ALL_READ)
  markAllRead(@Payload() payload: { userId: string }) {
    return this.notificationService.markAllRead(payload.userId);
  }
}
