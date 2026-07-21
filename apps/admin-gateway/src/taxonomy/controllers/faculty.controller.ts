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
  UpdateFacultyRequestDTO,
} from '@app/contracts';
import { rpcCall } from '../../utils/rpc-call';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Faculties')
@ApiBearerAuth()
@Controller('faculties')
export class FacultyController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a faculty' })
  create(@Body() body: CreateFacultyRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all faculties' })
  findAll() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a faculty by id' })
  findOne(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.FACULTY_FIND_ONE, {
      id,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a faculty' })
  update(@Param('id') id: string, @Body() body: UpdateFacultyRequestDTO) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.FACULTY_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a faculty' })
  remove(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.FACULTY_DELETE, {
      id,
    });
  }
}
