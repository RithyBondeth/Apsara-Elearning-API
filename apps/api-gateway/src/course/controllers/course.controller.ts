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
  DeleteResponseDTO,
  ICourseHttpController,
} from '@app/contracts';
import { AdminGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '@app/common';

@ApiTags('Courses')
@Controller('course')
export class CourseController implements ICourseHttpController {
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
  createCourse(
    @Body() createCourseReqDTO: CreateCourseRequestDTO,
  ): Promise<CourseResponseDTO> {
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
  findAllCourses(): Promise<CourseResponseDTO[]> {
    return rpcCall<CourseResponseDTO[]>(
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
  findAllPublished(): Promise<CourseResponseDTO[]> {
    return rpcCall<CourseResponseDTO[]>(
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
  findOneCourse(@Param('id') id: string): Promise<CourseResponseDTO> {
    return rpcCall<CourseResponseDTO>(
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
  findBySlug(@Param('slug') slug: string): Promise<CourseResponseDTO> {
    return rpcCall<CourseResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_SLUG,
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
  findBySubject(
    @Param('subjectId') subjectId: string,
  ): Promise<CourseResponseDTO[]> {
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
  findByGrade(
    @Param('gradeLevelId') gradeLevelId: string,
  ): Promise<CourseResponseDTO[]> {
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
  findByMajor(@Param('majorId') majorId: string): Promise<CourseResponseDTO[]> {
    return rpcCall<CourseResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_MAJOR,
      majorId,
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
  ): Promise<CourseResponseDTO> {
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
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course deleted',
    type: DeleteResponseDTO,
  })
  deleteCourse(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_DELETE,
      id,
    );
  }

  @Patch(':id/publish')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a course (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course published',
    type: CourseResponseDTO,
  })
  publishCourse(@Param('id') id: string): Promise<CourseResponseDTO> {
    return rpcCall<CourseResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_PUBLISH,
      id,
    );
  }

  @Patch(':id/unpublish')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a course (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course unpublished',
    type: CourseResponseDTO,
  })
  unpublishCourse(@Param('id') id: string): Promise<CourseResponseDTO> {
    return rpcCall<CourseResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_UNPUBLISH,
      id,
    );
  }
}
