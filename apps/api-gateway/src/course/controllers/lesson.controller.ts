import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COURSE_SERVICE } from '@app/contracts';
import { ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

// Public read-only access to lessons. Mutations go through the admin gateway.
@ApiTags('Lessons')
@Controller('lesson')
export class LessonController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Get()
  findAllByModule(@Query('moduleId') moduleId: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.LESSON_FIND_ALL, {
      moduleId,
    });
  }

  // Must precede `:id` so the literal segment is not captured as an id.
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_FIND_BY_SLUG,
      slug,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_FIND_ONE,
      id,
    );
  }
}
