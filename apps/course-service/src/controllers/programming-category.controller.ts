import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateProgrammingCategoryRequestDTO,
  UpdateProgrammingCategoryRequestDTO,
  I_PROGRAMMING_CATEGORY_SERVICE,
} from '@app/contracts';
import type {
  IProgrammingCategoryService,
  IProgrammingCategoryRpcController,
} from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '@app/utils';

@Controller()
export class ProgrammingCategoryController implements IProgrammingCategoryRpcController {
  constructor(
    @Inject(I_PROGRAMMING_CATEGORY_SERVICE)
    private readonly programmingCategoryService: IProgrammingCategoryService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_CREATE)
  create(@Payload() dto: CreateProgrammingCategoryRequestDTO) {
    return this.programmingCategoryService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_FIND_ALL)
  findAll() {
    return this.programmingCategoryService.findAll();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.programmingCategoryService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.programmingCategoryService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_UPDATE)
  update(
    @Payload() payload: UpdateProgrammingCategoryRequestDTO & { id: string },
  ) {
    const { id, data } = splitUpdate(payload);
    return this.programmingCategoryService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.programmingCategoryService.remove(idOf(payload));
  }
}
