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
 * DI tokens + service contracts for course-service. Controllers depend on
 * these; the module binds each concrete implementation.
 */

export const I_COURSE_SERVICE = 'ICourseService';
export const I_ENROLLMENT_SERVICE = 'IEnrollmentService';
export const I_FACULTY_SERVICE = 'IFacultyService';
export const I_GRADE_LEVEL_SERVICE = 'IGradeLevelService';
export const I_LESSON_SERVICE = 'ILessonService';
export const I_LESSON_PROGRESS_SERVICE = 'ILessonProgressService';
export const I_MAJOR_SERVICE = 'IMajorService';
export const I_MODULE_SERVICE = 'IModuleService';
export const I_PROGRAMMING_CATEGORY_SERVICE = 'IProgrammingCategoryService';
export const I_SUBJECT_SERVICE = 'ISubjectService';

export interface ICourseService {
  create(dto: CreateCourseRequestDTO): Promise<CourseResponseDTO>;
  findAll(): Promise<CourseResponseDTO[]>;
  findPublished(): Promise<CourseResponseDTO[]>;
  findPublishedOne(id: string): Promise<CourseResponseDTO>;
  findPublishedBySlug(slug: string): Promise<CourseResponseDTO>;
  search(dto: SearchCoursesRequestDTO): Promise<CourseResponseDTO[]>;
  findOne(id: string): Promise<CourseResponseDTO>;
  findBySlug(slug: string): Promise<CourseResponseDTO>;
  findBySubject(subjectId: string): Promise<CourseResponseDTO[]>;
  findByGrade(gradeLevelId: string): Promise<CourseResponseDTO[]>;
  findByMajor(majorId: string): Promise<CourseResponseDTO[]>;
  findByCategory(categoryId: string): Promise<CourseResponseDTO[]>;
  update(id: string, dto: UpdateCourseRequestDTO): Promise<CourseResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
  setPublished(id: string, published: boolean): Promise<CourseResponseDTO>;
}

export interface IEnrollmentService {
  enroll(userId: string, courseId: string): Promise<EnrollmentResponseDTO>;
  unenroll(userId: string, courseId: string): Promise<UnenrollResponseDTO>;
  findByUser(userId: string): Promise<EnrollmentResponseDTO[]>;
  findByCourse(courseId: string): Promise<EnrollmentResponseDTO[]>;
  check(userId: string, courseId: string): Promise<EnrollmentCheckResponseDTO>;
}

export interface IFacultyService {
  create(dto: CreateFacultyRequestDTO): Promise<FacultyResponseDTO>;
  findAll(): Promise<FacultyResponseDTO[]>;
  findOne(id: string): Promise<FacultyResponseDTO>;
  findBySlug(slug: string): Promise<FacultyResponseDTO>;
  update(id: string, dto: UpdateFacultyRequestDTO): Promise<FacultyResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IGradeLevelService {
  create(dto: CreateGradeLevelRequestDTO): Promise<GradeLevelResponseDTO>;
  findAll(): Promise<GradeLevelResponseDTO[]>;
  findOne(id: string): Promise<GradeLevelResponseDTO>;
  update(
    id: string,
    dto: UpdateGradeLevelRequestDTO,
  ): Promise<GradeLevelResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface ILessonService {
  create(
    moduleId: string,
    dto: CreateLessonRequestDTO,
  ): Promise<LessonResponseDTO>;
  findAllByModule(moduleId: string): Promise<LessonResponseDTO[]>;
  findOne(id: string): Promise<LessonResponseDTO>;
  findBySlug(slug: string): Promise<LessonResponseDTO>;
  findPublicByModule(
    moduleId: string,
    userId?: string,
  ): Promise<LessonResponseDTO[]>;
  findPublicOne(id: string, userId?: string): Promise<LessonResponseDTO>;
  findPublicBySlug(slug: string, userId?: string): Promise<LessonResponseDTO>;
  update(id: string, dto: UpdateLessonRequestDTO): Promise<LessonResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
  reorder(moduleId: string, orderedIds: string[]): Promise<LessonResponseDTO[]>;
}

export interface ILessonProgressService {
  markComplete(
    userId: string,
    lessonId: string,
  ): Promise<LessonCompletionResponseDTO>;
  findByUser(userId: string): Promise<LessonProgressResponseDTO[]>;
  findByLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgressResponseDTO>;
  recalculate(userId: string, courseId: string): Promise<EnrollmentResponseDTO>;
}

export interface IMajorService {
  create(dto: CreateMajorRequestDTO): Promise<MajorResponseDTO>;
  findAll(facultyId?: string): Promise<MajorResponseDTO[]>;
  findOne(id: string): Promise<MajorResponseDTO>;
  findBySlug(slug: string): Promise<MajorResponseDTO>;
  update(id: string, dto: UpdateMajorRequestDTO): Promise<MajorResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IModuleService {
  create(
    courseId: string,
    dto: CreateModuleRequestDTO,
  ): Promise<ModuleResponseDTO>;
  findAllByCourse(courseId: string): Promise<ModuleResponseDTO[]>;
  findOne(id: string): Promise<ModuleResponseDTO>;
  findPublicByCourse(courseId: string): Promise<ModuleResponseDTO[]>;
  findPublicOne(id: string): Promise<ModuleResponseDTO>;
  update(id: string, dto: UpdateModuleRequestDTO): Promise<ModuleResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
  reorder(courseId: string, orderedIds: string[]): Promise<ModuleResponseDTO[]>;
}

export interface IProgrammingCategoryService {
  create(
    dto: CreateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO>;
  findAll(): Promise<ProgrammingCategoryResponseDTO[]>;
  findOne(id: string): Promise<ProgrammingCategoryResponseDTO>;
  findBySlug(slug: string): Promise<ProgrammingCategoryResponseDTO>;
  update(
    id: string,
    dto: UpdateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface ISubjectService {
  create(dto: CreateSubjectRequestDTO): Promise<SubjectResponseDTO>;
  findAll(): Promise<SubjectResponseDTO[]>;
  findOne(id: string): Promise<SubjectResponseDTO>;
  findBySlug(slug: string): Promise<SubjectResponseDTO>;
  update(id: string, dto: UpdateSubjectRequestDTO): Promise<SubjectResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}
