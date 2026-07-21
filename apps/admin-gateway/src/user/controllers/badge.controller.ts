import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  USER_SERVICE,
  CreateBadgeRequestDTO,
  UpdateBadgeRequestDTO,
} from '@app/contracts';
import { rpcCall } from '../../utils/rpc-call';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Badges')
@ApiBearerAuth()
@Controller('badges')
export class BadgeController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() body: CreateBadgeRequestDTO) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.BADGE_CREATE, body);
  }

  @Get()
  findAll() {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.BADGE_FIND_ALL, {});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.BADGE_FIND_ONE, {
      id,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateBadgeRequestDTO) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.BADGE_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.BADGE_DELETE, { id });
  }

  @Post(':id/award/:userId')
  award(@Param('id') id: string, @Param('userId') userId: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.BADGE_AWARD, {
      badgeId: id,
      userId,
    });
  }
}
