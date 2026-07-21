import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateGradeLevelRequestDTO,
  UpdateGradeLevelRequestDTO,
  I_GRADE_LEVEL_SERVICE,
} from '@app/contracts';
import type { IGradeLevelService, IGradeLevelRpcController } from '@app/contracts';
import { idOf, splitUpdate } from '@app/utils';

@Controller()
export class GradeLevelRpcController implements IGradeLevelRpcController {
  constructor(
    @Inject(I_GRADE_LEVEL_SERVICE) private readonly gradeLevelRpcService: IGradeLevelService,
  ) {}

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
