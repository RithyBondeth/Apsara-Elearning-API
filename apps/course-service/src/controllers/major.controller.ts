import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateMajorRequestDTO,
  UpdateMajorRequestDTO,
  I_MAJOR_SERVICE,
} from '@app/contracts';
import type { IMajorService, IMajorRpcController } from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '@app/utils';

@Controller()
export class MajorController implements IMajorRpcController {
  constructor(
    @Inject(I_MAJOR_SERVICE) private readonly majorService: IMajorService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_CREATE)
  create(@Payload() dto: CreateMajorRequestDTO) {
    return this.majorService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_FIND_ALL)
  findAll(@Payload() payload?: { facultyId?: string }) {
    return this.majorService.findAll(payload?.facultyId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.majorService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.majorService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_UPDATE)
  update(@Payload() payload: UpdateMajorRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.majorService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.majorService.remove(idOf(payload));
  }
}
