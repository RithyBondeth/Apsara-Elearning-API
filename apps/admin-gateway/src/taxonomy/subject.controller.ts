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
  UpdateSubjectRequestDTO,
} from '@app/contracts';
import { rpcCall } from '../utils/rpc-call';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a subject' })
  create(@Body() body: CreateSubjectRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all subjects' })
  findAll() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by id' })
  findOne(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ONE, {
      id,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subject' })
  update(@Param('id') id: string, @Body() body: UpdateSubjectRequestDTO) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.SUBJECT_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subject' })
  remove(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.SUBJECT_DELETE, {
      id,
    });
  }
}
