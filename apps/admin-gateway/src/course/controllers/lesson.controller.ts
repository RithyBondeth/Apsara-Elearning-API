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
import {
  COURSE_SERVICE,
  CreateLessonRequestDTO,
  DeleteResponseDTO,
  IAdminLessonController,
  LessonResponseDTO,
  ReorderRequestDTO,
  UpdateLessonRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Lessons')
@ApiBearerAuth()
@Controller('modules/:moduleId/lessons')
export class LessonController implements IAdminLessonController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  create(
    @Param('moduleId') moduleId: string,
    @Body() body: CreateLessonRequestDTO,
  ): Promise<LessonResponseDTO> {
    return rpcCall<LessonResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_CREATE,
      { moduleId, ...body },
    );
  }

  @Get()
  findAll(@Param('moduleId') moduleId: string): Promise<LessonResponseDTO[]> {
    return rpcCall<LessonResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_FIND_ALL,
      { moduleId },
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<LessonResponseDTO> {
    return rpcCall<LessonResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_FIND_ONE,
      { id },
    );
  }

  // Declared before `:id` so the literal path wins.
  @Patch('reorder')
  reorder(
    @Param('moduleId') moduleId: string,
    @Body() body: ReorderRequestDTO,
  ): Promise<LessonResponseDTO[]> {
    return rpcCall<LessonResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_REORDER,
      { moduleId, orderedIds: body.orderedIds },
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateLessonRequestDTO,
  ): Promise<LessonResponseDTO> {
    return rpcCall<LessonResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.LESSON_DELETE,
      { id },
    );
  }
}
