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
  COURSE_SERVICE,
  CreateModuleRequestDTO,
  ReorderRequestDTO,
  UpdateModuleRequestDTO,
} from '@app/contracts';
import { rpcCall } from '../../utils/rpc-call';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Modules')
@ApiBearerAuth()
@Controller('courses/:courseId/modules')
export class ModuleController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() body: CreateModuleRequestDTO,
  ) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_CREATE, {
      courseId,
      ...body,
    });
  }

  @Get()
  findAll(@Param('courseId') courseId: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_FIND_ALL, {
      courseId,
    });
  }

  // Declared before `:id` so the literal path wins.
  @Patch('reorder')
  reorder(
    @Param('courseId') courseId: string,
    @Body() body: ReorderRequestDTO,
  ) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_REORDER, {
      courseId,
      orderedIds: body.orderedIds,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateModuleRequestDTO) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_DELETE, {
      id,
    });
  }
}
