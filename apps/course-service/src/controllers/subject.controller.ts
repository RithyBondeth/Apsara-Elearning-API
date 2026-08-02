import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateSubjectRequestDTO,
  UpdateSubjectRequestDTO,
  I_SUBJECT_SERVICE,
} from '@app/contracts';
import type { ISubjectService, ISubjectRpcController } from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '@app/utils';

@Controller()
export class SubjectController implements ISubjectRpcController {
  constructor(
    @Inject(I_SUBJECT_SERVICE) private readonly subjectService: ISubjectService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_CREATE)
  create(@Payload() dto: CreateSubjectRequestDTO) {
    return this.subjectService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ALL)
  findAll() {
    return this.subjectService.findAll();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.subjectService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.subjectService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_UPDATE)
  update(@Payload() payload: UpdateSubjectRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.subjectService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.subjectService.remove(idOf(payload));
  }
}
