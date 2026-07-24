import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  ILessonHttpController,
  LessonResponseDTO,
} from '@app/contracts';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '@app/common';

// Public read-only access to lessons. Mutations go through the admin gateway.
@ApiTags('Lessons')
@Controller('lesson')
export class LessonController implements ILessonHttpController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all lessons for a specific module' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lessons retrieved successfully',
    type: [LessonResponseDTO],
  })
  findAllByModule(
    @Query('moduleId') moduleId: string,
  ): Promise<LessonResponseDTO[]> {
    return rpcCall<LessonResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_FIND_ALL,
      { moduleId },
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a lesson by slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson retrieved successfully',
    type: LessonResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lesson not found',
  })
  findBySlug(@Param('slug') slug: string): Promise<LessonResponseDTO> {
    return rpcCall<LessonResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_FIND_BY_SLUG,
      slug,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific lesson by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson retrieved successfully',
    type: LessonResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lesson not found',
  })
  findOne(@Param('id') id: string): Promise<LessonResponseDTO> {
    return rpcCall<LessonResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_FIND_ONE,
      id,
    );
  }
}
