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
import { COURSE_SERVICE } from '@app/contracts/constants/services/course-service.constant';
import { rpcCall } from '../utils/rpc-call';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Modules')
@ApiBearerAuth()
@Controller('courses/:courseId/modules')
export class ModuleController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  create(@Param('courseId') courseId: string, @Body() body: unknown) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_CREATE, {
      courseId,
      ...(body as object),
    });
  }

  @Get()
  findAll(@Param('courseId') courseId: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_FIND_ALL, {
      courseId,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_UPDATE, {
      id,
      ...(body as object),
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_DELETE, {
      id,
    });
  }
}
