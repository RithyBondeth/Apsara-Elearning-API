import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
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
  CourseResponseDTO,
} from '@app/contracts';
import { AdminGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

@ApiTags('Courses')
@Controller('course')
export class CourseController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Course created',
    type: CourseResponseDTO,
  })
  createCourse(@Body() createCourseReqDTO: CreateCourseRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_CREATE,
      createCourseReqDTO,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All courses retrieved',
    type: [CourseResponseDTO],
  })
  findAllCourses() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_ALL,
      {},
    );
  }

  @Get('published')
  @ApiOperation({ summary: 'Get all published courses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Published courses retrieved',
    type: [CourseResponseDTO],
  })
  findAllPublished() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_PUBLISHED,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course retrieved',
    type: CourseResponseDTO,
  })
  findOneCourse(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_ONE,
      id,
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a course by slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course retrieved',
    type: CourseResponseDTO,
  })
  findBySlug(@Param('slug') slug: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_SLUG,
      slug,
    );
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get courses by category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Courses retrieved',
    type: [CourseResponseDTO],
  })
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
  @ApiOperation({ summary: 'Update a course (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course updated',
    type: CourseResponseDTO,
  })
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
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Course deleted' })
  deleteCourse(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.COURSE_DELETE, id);
  }

  @Patch(':id/publish')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a course (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Course published' })
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
  @ApiOperation({ summary: 'Unpublish a course (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Course unpublished' })
  unpublishCourse(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_UNPUBLISH,
      id,
    );
  }
}
