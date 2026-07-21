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
export class ModuleRpcController implements IModuleRpcController {
  constructor(
    @Inject(I_MODULE_SERVICE) private readonly moduleRpcService: IModuleService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_CREATE)
  create(@Payload() payload: CreateModuleRequestDTO & { courseId: string }) {
    const { courseId, ...dto } = payload;
    return this.moduleRpcService.create(courseId, dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_FIND_ALL)
  findAll(@Payload() payload: string | { courseId: string }) {
    const courseId = typeof payload === 'string' ? payload : payload.courseId;
    return this.moduleRpcService.findAllByCourse(courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.moduleRpcService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_UPDATE)
  update(@Payload() payload: UpdateModuleRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.moduleRpcService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.moduleRpcService.remove(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.MODULE_REORDER)
  reorder(@Payload() payload: { courseId: string; orderedIds: string[] }) {
    return this.moduleRpcService.reorder(payload.courseId, payload.orderedIds);
  }
}
