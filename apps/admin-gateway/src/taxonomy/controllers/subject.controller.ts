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
  CreateSubjectRequestDTO,
  DeleteResponseDTO,
  IAdminSubjectController,
  SubjectResponseDTO,
  UpdateSubjectRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectController implements IAdminSubjectController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a subject' })
  create(@Body() body: CreateSubjectRequestDTO): Promise<SubjectResponseDTO> {
    return rpcCall<SubjectResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all subjects' })
  findAll(): Promise<SubjectResponseDTO[]> {
    return rpcCall<SubjectResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by id' })
  findOne(@Param('id') id: string): Promise<SubjectResponseDTO> {
    return rpcCall<SubjectResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subject' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateSubjectRequestDTO,
  ): Promise<SubjectResponseDTO> {
    return rpcCall<SubjectResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subject' })
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_DELETE,
      { id },
    );
  }
}
