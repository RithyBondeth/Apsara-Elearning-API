import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MajorRpcService } from '../services/major-rpc.service';
import {
  COURSE_SERVICE,
  CreateMajorRequestDTO,
  UpdateMajorRequestDTO,
} from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '../utils/payload';

@Controller()
export class MajorRpcController {
  constructor(private readonly majorRpcService: MajorRpcService) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_CREATE)
  create(@Payload() dto: CreateMajorRequestDTO) {
    return this.majorRpcService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_FIND_ALL)
  findAll(@Payload() payload?: { facultyId?: string }) {
    return this.majorRpcService.findAll(payload?.facultyId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.majorRpcService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.majorRpcService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_UPDATE)
  update(@Payload() payload: UpdateMajorRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.majorRpcService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MAJOR_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.majorRpcService.remove(idOf(payload));
  }
}
