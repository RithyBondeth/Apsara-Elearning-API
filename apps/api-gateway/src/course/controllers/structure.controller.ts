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
  FacultyResponseDTO,
  GradeLevelResponseDTO,
  MajorResponseDTO,
} from '@app/contracts';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '@app/common';

/**
 * Public, read-only browsing of the content structure. Authoring these lives
 * on the admin-gateway.
 */
@ApiTags('Structure')
@Controller()
export class StructureController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  // ---- Grade levels (K–12) ----
  @Get('grade-level')
  @ApiOperation({ summary: 'Get all grade levels (Grade 1–12)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All grade levels retrieved',
    type: [GradeLevelResponseDTO],
  })
  findAllGradeLevels() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.GRADE_LEVEL_FIND_ALL,
      {},
    );
  }

  @Get('grade-level/:id')
  @ApiOperation({ summary: 'Get a grade level by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grade level retrieved',
    type: GradeLevelResponseDTO,
  })
  findOneGradeLevel(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.GRADE_LEVEL_FIND_ONE,
      id,
    );
  }

  // ---- Faculties (university) ----
  @Get('faculty')
  @ApiOperation({ summary: 'Get all faculties' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All faculties retrieved',
    type: [FacultyResponseDTO],
  })
  findAllFaculties() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_FIND_ALL,
      {},
    );
  }

  @Get('faculty/slug/:slug')
  @ApiOperation({ summary: 'Get a faculty by slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Faculty retrieved',
    type: FacultyResponseDTO,
  })
  findFacultyBySlug(@Param('slug') slug: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_FIND_BY_SLUG,
      slug,
    );
  }

  @Get('faculty/:id')
  @ApiOperation({ summary: 'Get a faculty by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Faculty retrieved',
    type: FacultyResponseDTO,
  })
  findOneFaculty(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.FACULTY_FIND_ONE,
      id,
    );
  }

  // ---- Majors (university) ----
  @Get('major')
  @ApiOperation({ summary: 'Get all majors, optionally filtered by faculty' })
  @ApiQuery({ name: 'facultyId', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All majors retrieved',
    type: [MajorResponseDTO],
  })
  findAllMajors(@Query('facultyId') facultyId?: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MAJOR_FIND_ALL, {
      facultyId,
    });
  }

  @Get('major/slug/:slug')
  @ApiOperation({ summary: 'Get a major by slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Major retrieved',
    type: MajorResponseDTO,
  })
  findMajorBySlug(@Param('slug') slug: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MAJOR_FIND_BY_SLUG,
      slug,
    );
  }

  @Get('major/:id')
  @ApiOperation({ summary: 'Get a major by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Major retrieved',
    type: MajorResponseDTO,
  })
  findOneMajor(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MAJOR_FIND_ONE,
      id,
    );
  }
}
