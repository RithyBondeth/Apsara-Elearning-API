import { Controller, Get, HttpStatus, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USER_SERVICE } from '@app/contracts';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '@app/common';

@ApiTags('Badges')
@Controller('badge')
export class BadgeController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get the badge catalog' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All badges retrieved, ordered by xpRequired',
  })
  findAll() {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.BADGE_FIND_ALL, {});
  }
}
