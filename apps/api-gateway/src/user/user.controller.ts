import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  USER_SERVICE,
  UpdateAvatarRequestDTO,
  UpdateUserRequestDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../utils/rpc-call';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get('me')
  getProfile(@CurrentUser('id') userId: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.FIND_ONE, {
      id: userId,
    });
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserRequestDTO,
  ) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.UPDATE, {
      id: userId,
      ...dto,
    });
  }

  @Patch('me/avatar')
  updateAvatar(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAvatarRequestDTO,
  ) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.UPDATE_AVATAR, {
      id: userId,
      avatar: dto.avatar,
    });
  }

  @Get('me/badges')
  getMyBadges(@CurrentUser('id') userId: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.BADGE_FIND_BY_USER, {
      userId,
    });
  }
}
