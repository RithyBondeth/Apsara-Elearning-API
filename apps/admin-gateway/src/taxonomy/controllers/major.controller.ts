import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateMajorRequestDTO,
  DeleteResponseDTO,
  IAdminMajorController,
  MajorResponseDTO,
  UpdateMajorRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Majors')
@ApiBearerAuth()
@Controller('majors')
export class MajorController implements IAdminMajorController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a major' })
  create(@Body() body: CreateMajorRequestDTO): Promise<MajorResponseDTO> {
    return rpcCall<MajorResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MAJOR_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List majors, optionally filtered by faculty' })
  @ApiQuery({ name: 'facultyId', required: false })
  findAll(@Query('facultyId') facultyId?: string): Promise<MajorResponseDTO[]> {
    return rpcCall<MajorResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MAJOR_FIND_ALL,
      { facultyId },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a major by id' })
  findOne(@Param('id') id: string): Promise<MajorResponseDTO> {
    return rpcCall<MajorResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MAJOR_FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a major' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateMajorRequestDTO,
  ): Promise<MajorResponseDTO> {
    return rpcCall<MajorResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MAJOR_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a major' })
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MAJOR_DELETE,
      { id },
    );
  }
}
