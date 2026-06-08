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

@Controller('modules/:moduleId/lessons')
export class LessonController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  create(@Param('moduleId') moduleId: string, @Body() body: unknown) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.LESSON_CREATE, {
      moduleId,
      ...(body as object),
    });
  }

  @Get()
  findAll(@Param('moduleId') moduleId: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.LESSON_FIND_ALL, {
      moduleId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.LESSON_FIND_ONE, {
      id,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.LESSON_UPDATE, {
      id,
      ...(body as object),
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.LESSON_DELETE, {
      id,
    });
  }
}
