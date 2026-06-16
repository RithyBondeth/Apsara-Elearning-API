import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COURSE_SERVICE } from '@app/contracts/constants/services/course-service.constant';
import { rpcCall } from '../../utils/rpc-call';

@Controller('course')
export class CourseController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  createCourse(@Body() createCourseReqDTO: any) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_CREATE,
      createCourseReqDTO,
    );
  }

  @Get()
  findAllCourses() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_ALL,
      {},
    );
  }

  @Get('published')
  findAllPublished() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_PUBLISHED,
      {},
    );
  }

  @Get(':id')
  findOneCourse(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_ONE,
      id,
    );
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_SLUG,
      slug,
    );
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_CATEGORY,
      categoryId,
    );
  }

  @Put(':id')
  updateCourse(@Param('id') id: string, @Body() updateCourseReqDTO: any) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.COURSE_UPDATE, {
      id,
      ...updateCourseReqDTO,
    });
  }

  @Delete(':id')
  deleteCourse(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.COURSE_DELETE, id);
  }

  @Patch(':id/publish')
  publishCourse(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_PUBLISH,
      id,
    );
  }

  @Patch(':id/unpublish')
  unpublishCourse(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_UNPUBLISH,
      id,
    );
  }
}
