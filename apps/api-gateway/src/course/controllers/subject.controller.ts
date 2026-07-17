import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateSubjectRequestDTO,
  UpdateSubjectRequestDTO,
  SubjectResponseDTO,
} from '@app/contracts';
import { AdminGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

@ApiTags('Subjects')
@Controller('subject')
export class SubjectController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subject (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subject created',
    type: SubjectResponseDTO,
  })
  createSubject(@Body() createSubjectReqDTO: CreateSubjectRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_CREATE,
      createSubjectReqDTO,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All subjects retrieved',
    type: [SubjectResponseDTO],
  })
  findAllSubjects() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ALL,
      {},
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a subject by slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject retrieved',
    type: SubjectResponseDTO,
  })
  findBySlug(@Param('slug') slug: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_FIND_BY_SLUG,
      slug,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject retrieved',
    type: SubjectResponseDTO,
  })
  findOneSubject(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ONE,
      id,
    );
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a subject (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject updated',
    type: SubjectResponseDTO,
  })
  updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectReqDTO: UpdateSubjectRequestDTO,
  ) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.SUBJECT_UPDATE, {
      id,
      ...updateSubjectReqDTO,
    });
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a subject (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subject deleted' })
  deleteSubject(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.SUBJECT_DELETE,
      id,
    );
  }
}
