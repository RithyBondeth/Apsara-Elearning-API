import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AdminReviewDTO,
  COURSE_SERVICE,
  SetReviewFeaturedRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Review moderation. Written reviews are user text, so none reaches the public
 * landing page until an admin features it here.
 */
@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List written reviews, newest first' })
  @ApiResponse({ status: HttpStatus.OK, type: [AdminReviewDTO] })
  findAll(): Promise<AdminReviewDTO[]> {
    return rpcCall<AdminReviewDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.RATING_ADMIN_LIST,
      {},
    );
  }

  @Patch(':id/featured')
  @ApiOperation({
    summary: 'Feature or unfeature a review on the landing page',
  })
  @ApiResponse({ status: HttpStatus.OK, type: AdminReviewDTO })
  setFeatured(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetReviewFeaturedRequestDTO,
  ): Promise<AdminReviewDTO> {
    return rpcCall<AdminReviewDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.RATING_SET_FEATURED,
      { id, featured: body.featured },
    );
  }
}
