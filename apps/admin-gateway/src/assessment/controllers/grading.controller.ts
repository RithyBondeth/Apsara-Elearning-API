import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ASSESSMENT_SERVICE,
  GradeAnswerRequestDTO,
  GradeAnswerResponseDTO,
  GradingItemResponseDTO,
  GradingQueryDTO,
} from '@app/contracts';
import { CurrentUser, rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Manual grading of quiz answers the auto-grader can't score (short answers
 * without an accepted-answer list). Grading rescores the attempt, may unlock
 * first-pass XP, and tells the learner once the attempt is fully graded.
 */
@ApiTags('Grading')
@ApiBearerAuth()
@Controller('grading')
export class GradingController {
  constructor(
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Answers waiting for (or already given) a grade' })
  @ApiResponse({ status: HttpStatus.OK, type: [GradingItemResponseDTO] })
  list(@Query() query: GradingQueryDTO): Promise<GradingItemResponseDTO[]> {
    return rpcCall<GradingItemResponseDTO[]>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.GRADING_LIST,
      { status: query.status, limit: query.limit },
    );
  }

  @Patch(':answerId')
  @ApiOperation({ summary: 'Grade (or regrade) one answer' })
  @ApiResponse({ status: HttpStatus.OK, type: GradeAnswerResponseDTO })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Points out of range, or an auto-graded answer',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No such answer' })
  grade(
    @CurrentUser('id') adminId: string,
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @Body() body: GradeAnswerRequestDTO,
  ): Promise<GradeAnswerResponseDTO> {
    return rpcCall<GradeAnswerResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.GRADING_GRADE,
      { adminId, answerId, points: body.points, feedback: body.feedback },
    );
  }
}
