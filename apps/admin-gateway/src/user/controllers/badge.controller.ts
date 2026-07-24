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
  AwardBadgeResponseDTO,
  BadgeResponseDTO,
  CreateBadgeRequestDTO,
  DeleteResponseDTO,
  IAdminBadgeController,
  UpdateBadgeRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Badges')
@ApiBearerAuth()
@Controller('badges')
export class BadgeController implements IAdminBadgeController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() body: CreateBadgeRequestDTO): Promise<BadgeResponseDTO> {
    return rpcCall<BadgeResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.BADGE_CREATE,
      body,
    );
  }

  @Get()
  findAll(): Promise<BadgeResponseDTO[]> {
    return rpcCall<BadgeResponseDTO[]>(
      this.userClient,
      USER_SERVICE.ACTIONS.BADGE_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<BadgeResponseDTO> {
    return rpcCall<BadgeResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.BADGE_FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateBadgeRequestDTO,
  ): Promise<BadgeResponseDTO> {
    return rpcCall<BadgeResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.BADGE_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.BADGE_DELETE,
      { id },
    );
  }

  @Post(':id/award/:userId')
  award(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<AwardBadgeResponseDTO> {
    return rpcCall<AwardBadgeResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.BADGE_AWARD,
      { badgeId: id, userId },
    );
  }
}
