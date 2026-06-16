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
import { COURSE_SERVICE } from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

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
  myEnrollments(@CurrentUser('id') userId: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.ENROLLMENT_FIND_BY_USER,
      { userId },
    );
  }

  @Get('check/:courseId')
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
