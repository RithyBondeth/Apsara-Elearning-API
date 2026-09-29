import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AdminUpdateUserRequestDTO,
  DeleteResponseDTO,
  IAdminUserController,
  USER_SERVICE,
  UserResponseDTO,
} from '@app/contracts';
import { CurrentUser, rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController implements IAdminUserController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all users',
    type: [UserResponseDTO],
  })
  findAll(): Promise<UserResponseDTO[]> {
    return rpcCall<UserResponseDTO[]>(
      this.userClient,
      USER_SERVICE.ACTIONS.FIND_ALL,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the user',
    type: UserResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  findOne(@Param('id') id: string): Promise<UserResponseDTO> {
    return rpcCall<UserResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: "Change a user's admin role, suspension, or name",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the updated user',
    type: UserResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Would demote/suspend yourself or leave no active admin',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  update(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserRequestDTO,
  ): Promise<UserResponseDTO> {
    return rpcCall<UserResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.ADMIN_UPDATE,
      { id, actorId, dto },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
    type: DeleteResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Would delete yourself or the last active admin',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  remove(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
  ): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.DELETE,
      { id, actorId },
    );
  }
}
