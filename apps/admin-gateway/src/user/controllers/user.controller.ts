import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  DeleteResponseDTO,
  IAdminUserController,
  USER_SERVICE,
  UserResponseDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
    type: DeleteResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.DELETE,
      { id },
    );
  }
}
