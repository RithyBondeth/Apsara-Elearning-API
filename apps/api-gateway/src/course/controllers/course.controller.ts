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
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateCourseRequestDTO,
  UpdateCourseRequestDTO,
} from '@app/contracts';
import { AdminGuard } from '@app/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

@Controller('course')
export class CourseController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  createCourse(@Body() createCourseReqDTO: CreateCourseRequestDTO) {
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
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  updateCourse(
    @Param('id') id: string,
    @Body() updateCourseReqDTO: UpdateCourseRequestDTO,
  ) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.COURSE_UPDATE, {
      id,
      ...updateCourseReqDTO,
    });
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  deleteCourse(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.COURSE_DELETE, id);
  }

  @Patch(':id/publish')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  publishCourse(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_PUBLISH,
      id,
    );
  }

  @Patch(':id/unpublish')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  unpublishCourse(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_UNPUBLISH,
      id,
    );
  }
}
