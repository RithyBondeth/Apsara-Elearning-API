import { DeleteResponseDTO } from '../../dtos/common/delete-response.dto';
import {
  CourseResponseDTO,
  CreateCourseRequestDTO,
  SearchCoursesRequestDTO,
  UpdateCourseRequestDTO,
} from '../../dtos/course/course.dto';
import {
  EnrollmentResponseDTO,
  EnrollmentCheckResponseDTO,
  UnenrollResponseDTO,
} from '../../dtos/course/enrollment.dto';
import {
  CreateFacultyRequestDTO,
  FacultyResponseDTO,
  UpdateFacultyRequestDTO,
} from '../../dtos/course/faculty.dto';
import {
  CreateGradeLevelRequestDTO,
  GradeLevelResponseDTO,
  UpdateGradeLevelRequestDTO,
} from '../../dtos/course/grade-level.dto';
import {
  CreateLessonRequestDTO,
  LessonResponseDTO,
  UpdateLessonRequestDTO,
} from '../../dtos/course/lesson.dto';
import {
  LessonCompletionResponseDTO,
  LessonProgressResponseDTO,
} from '../../dtos/course/lesson-progress.dto';
import {
  CreateMajorRequestDTO,
  MajorResponseDTO,
  UpdateMajorRequestDTO,
} from '../../dtos/course/major.dto';
import {
  CreateModuleRequestDTO,
  ModuleResponseDTO,
  UpdateModuleRequestDTO,
} from '../../dtos/course/module.dto';
import {
  CreateProgrammingCategoryRequestDTO,
  ProgrammingCategoryResponseDTO,
  UpdateProgrammingCategoryRequestDTO,
} from '../../dtos/course/programming-category.dto';
import {
  CreateSubjectRequestDTO,
  SubjectResponseDTO,
  UpdateSubjectRequestDTO,
} from '../../dtos/course/subject.dto';

/**
 * RPC controller contracts for course-service — one per resource domain.
 * Payloads are validated at the gateway; identifier-only actions accept either
 * the bare value or a `{ id }` / `{ slug }` envelope.
 */

export interface ICourseRpcController {
  create(dto: CreateCourseRequestDTO): Promise<CourseResponseDTO>;
  findAll(): Promise<CourseResponseDTO[]>;
  findPublished(): Promise<CourseResponseDTO[]>;
  search(payload: SearchCoursesRequestDTO): Promise<CourseResponseDTO[]>;
  findOne(payload: string | { id: string }): Promise<CourseResponseDTO>;
  findBySlug(payload: string | { slug: string }): Promise<CourseResponseDTO>;
  findBySubject(
    payload: string | { subjectId: string },
  ): Promise<CourseResponseDTO[]>;
  findByGrade(
    payload: string | { gradeLevelId: string },
  ): Promise<CourseResponseDTO[]>;
  findByMajor(
    payload: string | { majorId: string },
  ): Promise<CourseResponseDTO[]>;
  findByCategory(
    payload: string | { categoryId: string },
  ): Promise<CourseResponseDTO[]>;
  update(
    payload: UpdateCourseRequestDTO & { id: string },
  ): Promise<CourseResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  publish(payload: string | { id: string }): Promise<CourseResponseDTO>;
  unpublish(payload: string | { id: string }): Promise<CourseResponseDTO>;
}

export interface IEnrollmentRpcController {
  enroll(payload: {
    userId: string;
    courseId: string;
  }): Promise<EnrollmentResponseDTO>;
  unenroll(payload: {
    userId: string;
    courseId: string;
  }): Promise<UnenrollResponseDTO>;
  findByUser(payload: { userId: string }): Promise<EnrollmentResponseDTO[]>;
  findByCourse(
    payload: string | { courseId: string },
  ): Promise<EnrollmentResponseDTO[]>;
  check(payload: {
    userId: string;
    courseId: string;
  }): Promise<EnrollmentCheckResponseDTO>;
}

export interface IFacultyRpcController {
  create(dto: CreateFacultyRequestDTO): Promise<FacultyResponseDTO>;
  findAll(): Promise<FacultyResponseDTO[]>;
  findOne(payload: string | { id: string }): Promise<FacultyResponseDTO>;
  findBySlug(payload: string | { slug: string }): Promise<FacultyResponseDTO>;
  update(
    payload: UpdateFacultyRequestDTO & { id: string },
  ): Promise<FacultyResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
}

export interface IGradeLevelRpcController {
  create(dto: CreateGradeLevelRequestDTO): Promise<GradeLevelResponseDTO>;
  findAll(): Promise<GradeLevelResponseDTO[]>;
  findOne(payload: string | { id: string }): Promise<GradeLevelResponseDTO>;
  update(
    payload: UpdateGradeLevelRequestDTO & { id: string },
  ): Promise<GradeLevelResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
}

export interface ILessonRpcController {
  create(
    payload: CreateLessonRequestDTO & { moduleId: string },
  ): Promise<LessonResponseDTO>;
  findAll(payload: string | { moduleId: string }): Promise<LessonResponseDTO[]>;
  findOne(payload: string | { id: string }): Promise<LessonResponseDTO>;
  findBySlug(payload: string | { slug: string }): Promise<LessonResponseDTO>;
  update(
    payload: UpdateLessonRequestDTO & { id: string },
  ): Promise<LessonResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  reorder(payload: {
    moduleId: string;
    orderedIds: string[];
  }): Promise<LessonResponseDTO[]>;
}

export interface ILessonProgressRpcController {
  markComplete(payload: {
    userId: string;
    lessonId: string;
  }): Promise<LessonCompletionResponseDTO>;
  findByUser(payload: { userId: string }): Promise<LessonProgressResponseDTO[]>;
  findByLesson(payload: {
    userId: string;
    lessonId: string;
  }): Promise<LessonProgressResponseDTO>;
  calculate(payload: {
    userId: string;
    courseId: string;
  }): Promise<EnrollmentResponseDTO>;
}

export interface IMajorRpcController {
  create(dto: CreateMajorRequestDTO): Promise<MajorResponseDTO>;
  findAll(payload?: { facultyId?: string }): Promise<MajorResponseDTO[]>;
  findOne(payload: string | { id: string }): Promise<MajorResponseDTO>;
  findBySlug(payload: string | { slug: string }): Promise<MajorResponseDTO>;
  update(
    payload: UpdateMajorRequestDTO & { id: string },
  ): Promise<MajorResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
}

export interface IModuleRpcController {
  create(
    payload: CreateModuleRequestDTO & { courseId: string },
  ): Promise<ModuleResponseDTO>;
  findAll(payload: string | { courseId: string }): Promise<ModuleResponseDTO[]>;
  findOne(payload: string | { id: string }): Promise<ModuleResponseDTO>;
  update(
    payload: UpdateModuleRequestDTO & { id: string },
  ): Promise<ModuleResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  reorder(payload: {
    courseId: string;
    orderedIds: string[];
  }): Promise<ModuleResponseDTO[]>;
}

export interface IProgrammingCategoryRpcController {
  create(
    dto: CreateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO>;
  findAll(): Promise<ProgrammingCategoryResponseDTO[]>;
  findOne(
    payload: string | { id: string },
  ): Promise<ProgrammingCategoryResponseDTO>;
  findBySlug(
    payload: string | { slug: string },
  ): Promise<ProgrammingCategoryResponseDTO>;
  update(
    payload: UpdateProgrammingCategoryRequestDTO & { id: string },
  ): Promise<ProgrammingCategoryResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
}

export interface ISubjectRpcController {
  create(dto: CreateSubjectRequestDTO): Promise<SubjectResponseDTO>;
  findAll(): Promise<SubjectResponseDTO[]>;
  findOne(payload: string | { id: string }): Promise<SubjectResponseDTO>;
  findBySlug(payload: string | { slug: string }): Promise<SubjectResponseDTO>;
  update(
    payload: UpdateSubjectRequestDTO & { id: string },
  ): Promise<SubjectResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
}
