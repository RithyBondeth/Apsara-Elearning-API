import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CategoryRpcService } from '../services/category-rpc.service';
import {
  COURSE_SERVICE,
  CreateCategoryRequestDTO,
  UpdateCategoryRequestDTO,
} from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '../utils/payload';

@Controller()
export class CategoryRpcController {
  constructor(private readonly categoryRpcService: CategoryRpcService) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.CATEGORY_CREATE)
  create(@Payload() dto: CreateCategoryRequestDTO) {
    return this.categoryRpcService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.CATEGORY_FIND_ALL)
  findAll() {
    return this.categoryRpcService.findAll();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.CATEGORY_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.categoryRpcService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.CATEGORY_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.categoryRpcService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.CATEGORY_UPDATE)
  update(
    @Payload() payload: UpdateCategoryRequestDTO & { id: string },
  ) {
    const { id, data } = splitUpdate(payload);
    return this.categoryRpcService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.CATEGORY_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.categoryRpcService.remove(idOf(payload));
  }
}
