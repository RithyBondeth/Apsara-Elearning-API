import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateCourseRequestDTO,
  UpdateCourseRequestDTO,
  CourseResponseDTO,
  DeleteResponseDTO,
  IAdminCourseController,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CourseController implements IAdminCourseController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Course created successfully',
    type: CourseResponseDTO,
  })
  create(@Body() body: CreateCourseRequestDTO): Promise<CourseResponseDTO> {
    return rpcCall<CourseResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all courses',
    type: [CourseResponseDTO],
  })
  findAll(): Promise<CourseResponseDTO[]> {
    return rpcCall<CourseResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the course',
    type: CourseResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  findOne(@Param('id') id: string): Promise<CourseResponseDTO> {
    return rpcCall<CourseResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course updated successfully',
    type: CourseResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  update(
    @Param('id') id: string,
    @Body() body: UpdateCourseRequestDTO,
  ): Promise<CourseResponseDTO> {
    return rpcCall<CourseResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course deleted successfully',
    type: DeleteResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_DELETE,
      { id },
    );
  }
}
