import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COURSE_SERVICE, ModuleResponseDTO } from '@app/contracts';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

// Public read-only access to modules. Mutations go through the admin gateway.
@ApiTags('Modules')
@Controller('module')
export class ModuleController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all modules for a specific course' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Modules retrieved successfully',
    type: [ModuleResponseDTO],
  })
  findAllByCourse(@Query('courseId') courseId: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_FIND_ALL, {
      courseId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific module by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Module retrieved successfully',
    type: ModuleResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Module not found' })
  findOne(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MODULE_FIND_ONE,
      id,
    );
  }
}
