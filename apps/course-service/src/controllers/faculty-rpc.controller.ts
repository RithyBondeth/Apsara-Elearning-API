import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FacultyRpcService } from '../services/faculty-rpc.service';
import {
  COURSE_SERVICE,
  CreateFacultyRequestDTO,
  UpdateFacultyRequestDTO,
} from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '../utils/payload';

@Controller()
export class FacultyRpcController {
  constructor(private readonly facultyRpcService: FacultyRpcService) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_CREATE)
  create(@Payload() dto: CreateFacultyRequestDTO) {
    return this.facultyRpcService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_FIND_ALL)
  findAll() {
    return this.facultyRpcService.findAll();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.facultyRpcService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.facultyRpcService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_UPDATE)
  update(@Payload() payload: UpdateFacultyRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.facultyRpcService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.FACULTY_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.facultyRpcService.remove(idOf(payload));
  }
}
