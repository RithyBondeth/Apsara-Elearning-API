import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  USER_SERVICE,
  UpdateUserRequestDTO,
  TAvatarPreset,
  I_USER_SERVICE,
} from '@app/contracts';
import type { IUserService, IUserRpcController } from '@app/contracts';
import { idOf, splitUpdate } from '@app/utils';

@Controller()
export class UserController implements IUserRpcController {
  constructor(
    @Inject(I_USER_SERVICE) private readonly userService: IUserService,
  ) {}

  @MessagePattern(USER_SERVICE.ACTIONS.FIND_ALL)
  findAll() {
    return this.userService.findAll();
  }

  @MessagePattern(USER_SERVICE.ACTIONS.FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.userService.findOne(idOf(payload));
  }

  @MessagePattern(USER_SERVICE.ACTIONS.FIND_BY_EMAIL)
  findByEmail(@Payload() payload: string | { email: string }) {
    const email = typeof payload === 'string' ? payload : payload.email;
    return this.userService.findByEmail(email);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.UPDATE)
  update(@Payload() payload: UpdateUserRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.userService.update(id, data);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.UPDATE_AVATAR)
  updateAvatar(@Payload() payload: { id: string; avatar: TAvatarPreset }) {
    return this.userService.updateAvatar(payload.id, payload.avatar);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.userService.remove(idOf(payload));
  }

  @MessagePattern(USER_SERVICE.ACTIONS.ADD_XP)
  addXp(@Payload() payload: { userId: string; amount: number }) {
    return this.userService.addXp(payload.userId, payload.amount);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.UPDATE_STREAK)
  updateStreak(@Payload() payload: { userId: string; reset?: boolean }) {
    return this.userService.updateStreak(payload.userId, payload.reset);
  }
}
