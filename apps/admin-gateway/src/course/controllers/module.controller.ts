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
  CreateModuleRequestDTO,
  DeleteResponseDTO,
  IAdminModuleController,
  ModuleResponseDTO,
  ReorderRequestDTO,
  UpdateModuleRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Modules')
@ApiBearerAuth()
@Controller('courses/:courseId/modules')
export class ModuleController implements IAdminModuleController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() body: CreateModuleRequestDTO,
  ): Promise<ModuleResponseDTO> {
    return rpcCall<ModuleResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MODULE_CREATE,
      { courseId, ...body },
    );
  }

  @Get()
  findAll(@Param('courseId') courseId: string): Promise<ModuleResponseDTO[]> {
    return rpcCall<ModuleResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MODULE_FIND_ALL,
      { courseId },
    );
  }

  // Declared before `:id` so the literal path wins.
  @Patch('reorder')
  reorder(
    @Param('courseId') courseId: string,
    @Body() body: ReorderRequestDTO,
  ): Promise<ModuleResponseDTO[]> {
    return rpcCall<ModuleResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MODULE_REORDER,
      { courseId, orderedIds: body.orderedIds },
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateModuleRequestDTO,
  ): Promise<ModuleResponseDTO> {
    return rpcCall<ModuleResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MODULE_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MODULE_DELETE,
      { id },
    );
  }
}
