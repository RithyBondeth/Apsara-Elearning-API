import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COURSE_SERVICE, EnrollmentResponseDTO } from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '@app/common';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollment')
export class EnrollmentController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post(':courseId')
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Enrolled successfully',
    type: EnrollmentResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  enroll(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.ENROLL, {
      userId,
      courseId,
    });
  }

  @Delete(':courseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unenroll from a course' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unenrolled successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  unenroll(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.UNENROLL, {
      userId,
      courseId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get current user enrollments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Enrollments retrieved',
    type: [EnrollmentResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  myEnrollments(@CurrentUser('id') userId: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.ENROLLMENT_FIND_BY_USER,
      { userId },
    );
  }

  @Get('check/:courseId')
  @ApiOperation({ summary: 'Check if current user is enrolled in a course' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Enrollment status checked',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  check(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.ENROLLMENT_CHECK, {
      userId,
      courseId,
    });
  }
}
