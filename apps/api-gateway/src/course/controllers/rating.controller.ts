import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  DeleteResponseDTO,
  IRatingHttpController,
  RatingQueryDTO,
  RatingResponseDTO,
  RatingSummaryResponseDTO,
  UpsertRatingRequestDTO,
} from '@app/contracts';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, rpcCall } from '@app/common';

/**
 * Course ratings.
 *
 * Reading the summary is public — it is social proof on a public course page.
 * Writing requires a session, and course-service additionally requires the
 * learner to be enrolled.
 */
@ApiTags('Ratings')
@Controller('course/:courseId')
export class RatingController implements IRatingHttpController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Get('ratings')
  @ApiOperation({ summary: 'Get a course rating summary and recent reviews' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Average (null when unrated), count, star distribution and recent written reviews',
    type: RatingSummaryResponseDTO,
  })
  findByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: RatingQueryDTO,
  ): Promise<RatingSummaryResponseDTO> {
    return rpcCall<RatingSummaryResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.RATING_FIND_BY_COURSE,
      { courseId, limit: query.limit },
    );
  }

  @Get('rating/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get the learner's own rating, if any" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The learner’s rating, or null when they have not rated',
    type: RatingResponseDTO,
  })
  findMine(
    @CurrentUser('id') userId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<RatingResponseDTO | null> {
    return rpcCall<RatingResponseDTO | null>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.RATING_FIND_MINE,
      { userId, courseId },
    );
  }

  @Put('rating')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Rate a course (creates or replaces your rating)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating saved',
    type: RatingResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not enrolled in this course',
  })
  upsert(
    @CurrentUser('id') userId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: UpsertRatingRequestDTO,
  ): Promise<RatingResponseDTO> {
    return rpcCall<RatingResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.RATING_UPSERT,
      { userId, courseId, dto },
    );
  }

  @Delete('rating')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove your rating' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating removed',
    type: DeleteResponseDTO,
  })
  remove(
    @CurrentUser('id') userId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.RATING_DELETE,
      { userId, courseId },
    );
  }
}
