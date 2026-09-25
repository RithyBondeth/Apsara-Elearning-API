import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateTestimonialRequestDTO,
  I_TESTIMONIAL_SERVICE,
  UpdateTestimonialRequestDTO,
} from '@app/contracts';
import type { ITestimonialService } from '@app/contracts';
import { idOf } from '@app/utils';

@Controller()
export class TestimonialController {
  constructor(
    @Inject(I_TESTIMONIAL_SERVICE)
    private readonly testimonialService: ITestimonialService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.TESTIMONIAL_CREATE)
  create(@Payload() dto: CreateTestimonialRequestDTO) {
    return this.testimonialService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.TESTIMONIAL_FIND_ALL)
  findAll() {
    return this.testimonialService.findAll();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.TESTIMONIAL_UPDATE)
  update(@Payload() payload: { id: string; dto: UpdateTestimonialRequestDTO }) {
    return this.testimonialService.update(payload.id, payload.dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.TESTIMONIAL_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.testimonialService.remove(idOf(payload));
  }
}
