import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateModuleRequestDTO,
  UpdateModuleRequestDTO,
  I_MODULE_SERVICE,
} from '@app/contracts';
import type { IModuleService, IModuleRpcController } from '@app/contracts';
import { idOf, splitUpdate } from '@app/utils';

@Controller()
export class ModuleController implements IModuleRpcController {
  constructor(
    @Inject(I_MODULE_SERVICE) private readonly moduleService: IModuleService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_CREATE)
  create(@Payload() payload: CreateModuleRequestDTO & { courseId: string }) {
    const { courseId, ...dto } = payload;
    return this.moduleService.create(courseId, dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_FIND_ALL)
  findAll(@Payload() payload: string | { courseId: string }) {
    const courseId = typeof payload === 'string' ? payload : payload.courseId;
    return this.moduleService.findAllByCourse(courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.moduleService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_UPDATE)
  update(@Payload() payload: UpdateModuleRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.moduleService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.moduleService.remove(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_REORDER)
  reorder(@Payload() payload: { courseId: string; orderedIds: string[] }) {
    return this.moduleService.reorder(payload.courseId, payload.orderedIds);
  }
}
