import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GradeLevelRpcService } from '../services/grade-level-rpc.service';
import {
  COURSE_SERVICE,
  CreateGradeLevelRequestDTO,
  UpdateGradeLevelRequestDTO,
} from '@app/contracts';
import { idOf, splitUpdate } from '../utils/payload';

@Controller()
export class GradeLevelRpcController {
  constructor(private readonly gradeLevelRpcService: GradeLevelRpcService) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.GRADE_LEVEL_CREATE)
  create(@Payload() dto: CreateGradeLevelRequestDTO) {
    return this.gradeLevelRpcService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.GRADE_LEVEL_FIND_ALL)
  findAll() {
    return this.gradeLevelRpcService.findAll();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.GRADE_LEVEL_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.gradeLevelRpcService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.GRADE_LEVEL_UPDATE)
  update(@Payload() payload: UpdateGradeLevelRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.gradeLevelRpcService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.GRADE_LEVEL_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.gradeLevelRpcService.remove(idOf(payload));
  }
}
