import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubjectRpcService } from '../services/subject-rpc.service';
import {
  COURSE_SERVICE,
  CreateSubjectRequestDTO,
  UpdateSubjectRequestDTO,
} from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '../utils/payload';

@Controller()
export class SubjectRpcController {
  constructor(private readonly subjectRpcService: SubjectRpcService) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_CREATE)
  create(@Payload() dto: CreateSubjectRequestDTO) {
    return this.subjectRpcService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ALL)
  findAll() {
    return this.subjectRpcService.findAll();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.subjectRpcService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.subjectRpcService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_UPDATE)
  update(@Payload() payload: UpdateSubjectRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.subjectRpcService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.SUBJECT_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.subjectRpcService.remove(idOf(payload));
  }
}
