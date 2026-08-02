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
  CreateFacultyRequestDTO,
  DeleteResponseDTO,
  FacultyResponseDTO,
  IAdminFacultyController,
  UpdateFacultyRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Faculties')
@ApiBearerAuth()
@Controller('faculties')
export class FacultyController implements IAdminFacultyController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a faculty' })
  create(@Body() body: CreateFacultyRequestDTO): Promise<FacultyResponseDTO> {
    return rpcCall<FacultyResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all faculties' })
  findAll(): Promise<FacultyResponseDTO[]> {
    return rpcCall<FacultyResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a faculty by id' })
  findOne(@Param('id') id: string): Promise<FacultyResponseDTO> {
    return rpcCall<FacultyResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a faculty' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateFacultyRequestDTO,
  ): Promise<FacultyResponseDTO> {
    return rpcCall<FacultyResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a faculty' })
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_DELETE,
      { id },
    );
  }
}
