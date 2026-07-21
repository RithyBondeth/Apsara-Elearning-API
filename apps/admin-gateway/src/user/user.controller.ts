import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USER_SERVICE } from '@app/contracts/constants/services/user-service.constant';
import { rpcCall } from '../utils/rpc-call';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all users' })
  findAll() {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.FIND_ALL, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the user' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.FIND_ONE, { id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  remove(@Param('id') id: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.DELETE, { id });
  }
}
