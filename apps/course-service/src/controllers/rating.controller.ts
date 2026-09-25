import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  FEATURED_REVIEWS_LIMIT,
  I_RATING_SERVICE,
  RATINGS_DEFAULT_LIMIT,
  RATINGS_MAX_LIMIT,
  UpsertRatingRequestDTO,
} from '@app/contracts';
import type { IRatingRpcController, IRatingService } from '@app/contracts';

@Controller()
export class RatingController implements IRatingRpcController {
  constructor(
    @Inject(I_RATING_SERVICE) private readonly ratingService: IRatingService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.RATING_UPSERT)
  upsert(
    @Payload()
    payload: {
      userId: string;
      courseId: string;
      dto: UpsertRatingRequestDTO;
    },
  ) {
    return this.ratingService.upsert(
      payload.userId,
      payload.courseId,
      payload.dto,
    );
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.RATING_DELETE)
  remove(@Payload() payload: { userId: string; courseId: string }) {
    return this.ratingService.remove(payload.userId, payload.courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.RATING_FIND_BY_COURSE)
  findByCourse(@Payload() payload: { courseId: string; limit?: number }) {
    // Validated at the gateway; clamp here too since any service can call it.
    const requested = Number(payload.limit ?? RATINGS_DEFAULT_LIMIT);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), RATINGS_MAX_LIMIT)
      : RATINGS_DEFAULT_LIMIT;
    return this.ratingService.findByCourse(payload.courseId, limit);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.RATING_FIND_MINE)
  findMine(@Payload() payload: { userId: string; courseId: string }) {
    return this.ratingService.findMine(payload.userId, payload.courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.RATING_FIND_FEATURED)
  findFeatured() {
    return this.ratingService.findFeatured(FEATURED_REVIEWS_LIMIT);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.RATING_ADMIN_LIST)
  listForAdmin() {
    return this.ratingService.listForAdmin();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.RATING_SET_FEATURED)
  setFeatured(@Payload() payload: { id: string; featured: boolean }) {
    return this.ratingService.setFeatured(
      payload.id,
      payload.featured === true,
    );
  }
}
