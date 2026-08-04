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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateCourseRequestDTO,
  UpdateCourseRequestDTO,
  CourseResponseDTO,
  ModuleWithLessonsResponseDTO,
  SearchCoursesRequestDTO,
} from '@app/contracts';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  Roles,
  RolesGuard,
} from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '@app/common';

@ApiTags('Courses')
@Controller('course')
export class CourseController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Course created',
    type: CourseResponseDTO,
  })
  createCourse(@Body() createCourseReqDTO: CreateCourseRequestDTO) {
    return rpcCall<CourseResponseDTO>(
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
    return rpcCall<CourseResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_PUBLISHED,
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
    return rpcCall<CourseResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_PUBLISHED,
      {},
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search published courses by keyword + filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Matching courses retrieved',
    type: [CourseResponseDTO],
  })
  searchCourses(
    @Query() query: SearchCoursesRequestDTO,
  ): Promise<CourseResponseDTO[]> {
    return rpcCall<CourseResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_SEARCH,
      query,
    );
  }

  /**
   * The whole outline in one call. Without it a client has to walk
   * course → modules → lessons, which is 1 + N requests per course — the
   * catalog and dashboard were each fanning out into hundreds.
   *
   * Optional auth: signed-in students with the right entitlement get lesson
   * bodies, everyone else gets the same outline with `locked: true`.
   */
  @Get(':id/structure')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a course outline: modules with their lessons' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course structure retrieved',
    type: [ModuleWithLessonsResponseDTO],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found or not published',
  })
  findCourseStructure(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ): Promise<ModuleWithLessonsResponseDTO[]> {
    return rpcCall<ModuleWithLessonsResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_STRUCTURE,
      { courseId: id, userId },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course retrieved',
    type: CourseResponseDTO,
  })
  findOneCourse(@Param('id') id: string): Promise<CourseResponseDTO> {
    return rpcCall<CourseResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_PUBLISHED_ONE,
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
    return rpcCall<CourseResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_PUBLISHED_BY_SLUG,
      slug,
    );
  }

  @Get('subject/:subjectId')
  @ApiOperation({ summary: 'Get courses by subject ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Courses retrieved',
    type: [CourseResponseDTO],
  })
  findBySubject(@Param('subjectId') subjectId: string) {
    return rpcCall<CourseResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_SUBJECT,
      subjectId,
    );
  }

  @Get('grade/:gradeLevelId')
  @ApiOperation({ summary: 'Get courses by grade level ID (K–12)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Courses retrieved',
    type: [CourseResponseDTO],
  })
  findByGrade(@Param('gradeLevelId') gradeLevelId: string) {
    return rpcCall<CourseResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_GRADE,
      gradeLevelId,
    );
  }

  @Get('major/:majorId')
  @ApiOperation({ summary: 'Get courses by major ID (university)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Courses retrieved',
    type: [CourseResponseDTO],
  })
  findByMajor(@Param('majorId') majorId: string) {
    return rpcCall<CourseResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_MAJOR,
      majorId,
    );
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    return rpcCall<CourseResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_UPDATE,
      {
        id,
        ...updateCourseReqDTO,
      },
    );
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course deleted',
    type: String,
  })
  deleteCourse(@Param('id') id: string) {
    return rpcCall<string>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_DELETE,
      id,
    );
  }

  @Patch(':id/publish')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
