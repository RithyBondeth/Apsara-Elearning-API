import {
  Body,
  Controller,
  Get,
  HttpStatus,
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  getProfile(@CurrentUser('id') userId: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.FIND_ONE, {
      id: userId,
    });
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Update current user avatar' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avatar updated successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get current user badges' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Badges retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  getMyBadges(@CurrentUser('id') userId: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.BADGE_FIND_BY_USER, {
      userId,
    });
  }
}
