import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateFacultyRequestDTO,
  UpdateFacultyRequestDTO,
  I_FACULTY_SERVICE,
} from '@app/contracts';
import type { IFacultyService, IFacultyRpcController } from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '@app/utils';

@Controller()
export class FacultyController implements IFacultyRpcController {
  constructor(
    @Inject(I_FACULTY_SERVICE) private readonly facultyService: IFacultyService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_CREATE)
  create(@Payload() dto: CreateFacultyRequestDTO) {
    return this.facultyService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_FIND_ALL)
  findAll() {
    return this.facultyService.findAll();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.facultyService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.facultyService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_UPDATE)
  update(@Payload() payload: UpdateFacultyRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.facultyService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.facultyService.remove(idOf(payload));
  }
}
