import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserRpcService } from '../services/user-rpc.service';
import { USER_SERVICE, UpdateUserRequestDTO } from '@app/contracts';
import { idOf, splitUpdate } from '../utils/payload';

@Controller()
export class UserRpcController {
  constructor(private readonly userRpcService: UserRpcService) {}

  @MessagePattern(USER_SERVICE.ACTIONS.FIND_ALL)
  findAll() {
    return this.userRpcService.findAll();
  }

  @MessagePattern(USER_SERVICE.ACTIONS.FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.userRpcService.findOne(idOf(payload));
  }

  @MessagePattern(USER_SERVICE.ACTIONS.FIND_BY_EMAIL)
  findByEmail(@Payload() payload: string | { email: string }) {
    const email = typeof payload === 'string' ? payload : payload.email;
    return this.userRpcService.findByEmail(email);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.UPDATE)
  update(@Payload() payload: UpdateUserRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.userRpcService.update(id, data);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.UPDATE_AVATAR)
  updateAvatar(@Payload() payload: { id: string; avatar: string }) {
    return this.userRpcService.updateAvatar(payload.id, payload.avatar);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.userRpcService.remove(idOf(payload));
  }

  @MessagePattern(USER_SERVICE.ACTIONS.ADD_XP)
  addXp(@Payload() payload: { userId: string; amount: number }) {
    return this.userRpcService.addXp(payload.userId, payload.amount);
  }

  @MessagePattern(USER_SERVICE.ACTIONS.UPDATE_STREAK)
  updateStreak(@Payload() payload: { userId: string; reset?: boolean }) {
    return this.userRpcService.updateStreak(payload.userId, payload.reset);
  }
}
