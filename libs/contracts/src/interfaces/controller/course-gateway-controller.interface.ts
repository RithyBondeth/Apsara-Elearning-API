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
  ReorderRequestDTO,
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
 * HTTP gateway controller contracts for the course domain. `*HttpController`
 * interfaces back the public api-gateway; `Admin*Controller` interfaces back
 * the admin-gateway authoring endpoints.
 */

// ---- Public (api-gateway) ----

export interface ICourseHttpController {
  createCourse(dto: CreateCourseRequestDTO): Promise<CourseResponseDTO>;
  findAllCourses(): Promise<CourseResponseDTO[]>;
  findAllPublished(): Promise<CourseResponseDTO[]>;
  searchCourses(query: SearchCoursesRequestDTO): Promise<CourseResponseDTO[]>;
  findOneCourse(id: string): Promise<CourseResponseDTO>;
  findBySlug(slug: string): Promise<CourseResponseDTO>;
  findBySubject(subjectId: string): Promise<CourseResponseDTO[]>;
  findByGrade(gradeLevelId: string): Promise<CourseResponseDTO[]>;
  findByMajor(majorId: string): Promise<CourseResponseDTO[]>;
  updateCourse(
    id: string,
    dto: UpdateCourseRequestDTO,
  ): Promise<CourseResponseDTO>;
  deleteCourse(id: string): Promise<DeleteResponseDTO>;
  publishCourse(id: string): Promise<CourseResponseDTO>;
  unpublishCourse(id: string): Promise<CourseResponseDTO>;
}

export interface IModuleHttpController {
  findAllByCourse(courseId: string): Promise<ModuleResponseDTO[]>;
  findOne(id: string): Promise<ModuleResponseDTO>;
}

export interface ILessonHttpController {
  findAllByModule(
    moduleId: string,
    userId?: string,
  ): Promise<LessonResponseDTO[]>;
  findBySlug(slug: string, userId?: string): Promise<LessonResponseDTO>;
  findOne(id: string, userId?: string): Promise<LessonResponseDTO>;
}

export interface ISubjectHttpController {
  createSubject(dto: CreateSubjectRequestDTO): Promise<SubjectResponseDTO>;
  findAllSubjects(): Promise<SubjectResponseDTO[]>;
  findBySlug(slug: string): Promise<SubjectResponseDTO>;
  findOneSubject(id: string): Promise<SubjectResponseDTO>;
  updateSubject(
    id: string,
    dto: UpdateSubjectRequestDTO,
  ): Promise<SubjectResponseDTO>;
  deleteSubject(id: string): Promise<DeleteResponseDTO>;
}

export interface IStructureHttpController {
  findAllGradeLevels(): Promise<GradeLevelResponseDTO[]>;
  findOneGradeLevel(id: string): Promise<GradeLevelResponseDTO>;
  findAllFaculties(): Promise<FacultyResponseDTO[]>;
  findFacultyBySlug(slug: string): Promise<FacultyResponseDTO>;
  findOneFaculty(id: string): Promise<FacultyResponseDTO>;
  findAllMajors(facultyId?: string): Promise<MajorResponseDTO[]>;
  findMajorBySlug(slug: string): Promise<MajorResponseDTO>;
  findOneMajor(id: string): Promise<MajorResponseDTO>;
}

export interface ILessonProgressHttpController {
  markComplete(
    userId: string,
    lessonId: string,
  ): Promise<LessonCompletionResponseDTO>;
  myProgress(userId: string): Promise<LessonProgressResponseDTO[]>;
  progressForLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgressResponseDTO>;
  recalculate(userId: string, courseId: string): Promise<EnrollmentResponseDTO>;
}

export interface IProgrammingCategoryHttpController {
  createCategory(
    dto: CreateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO>;
  findAllCategories(): Promise<ProgrammingCategoryResponseDTO[]>;
  findBySlug(slug: string): Promise<ProgrammingCategoryResponseDTO>;
  findCoursesByCategory(id: string): Promise<CourseResponseDTO[]>;
  findOneCategory(id: string): Promise<ProgrammingCategoryResponseDTO>;
  updateCategory(
    id: string,
    dto: UpdateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO>;
  deleteCategory(id: string): Promise<DeleteResponseDTO>;
}

export interface IEnrollmentHttpController {
  enroll(userId: string, courseId: string): Promise<EnrollmentResponseDTO>;
  unenroll(userId: string, courseId: string): Promise<UnenrollResponseDTO>;
  myEnrollments(userId: string): Promise<EnrollmentResponseDTO[]>;
  check(userId: string, courseId: string): Promise<EnrollmentCheckResponseDTO>;
}

// ---- Admin (admin-gateway) ----

export interface IAdminCourseController {
  create(dto: CreateCourseRequestDTO): Promise<CourseResponseDTO>;
  findAll(): Promise<CourseResponseDTO[]>;
  findOne(id: string): Promise<CourseResponseDTO>;
  update(id: string, dto: UpdateCourseRequestDTO): Promise<CourseResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminModuleController {
  create(
    courseId: string,
    dto: CreateModuleRequestDTO,
  ): Promise<ModuleResponseDTO>;
  findAll(courseId: string): Promise<ModuleResponseDTO[]>;
  reorder(
    courseId: string,
    dto: ReorderRequestDTO,
  ): Promise<ModuleResponseDTO[]>;
  update(id: string, dto: UpdateModuleRequestDTO): Promise<ModuleResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminLessonController {
  create(
    moduleId: string,
    dto: CreateLessonRequestDTO,
  ): Promise<LessonResponseDTO>;
  findAll(moduleId: string): Promise<LessonResponseDTO[]>;
  findOne(id: string): Promise<LessonResponseDTO>;
  reorder(
    moduleId: string,
    dto: ReorderRequestDTO,
  ): Promise<LessonResponseDTO[]>;
  update(id: string, dto: UpdateLessonRequestDTO): Promise<LessonResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminSubjectController {
  create(dto: CreateSubjectRequestDTO): Promise<SubjectResponseDTO>;
  findAll(): Promise<SubjectResponseDTO[]>;
  findOne(id: string): Promise<SubjectResponseDTO>;
  update(id: string, dto: UpdateSubjectRequestDTO): Promise<SubjectResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminGradeLevelController {
  create(dto: CreateGradeLevelRequestDTO): Promise<GradeLevelResponseDTO>;
  findAll(): Promise<GradeLevelResponseDTO[]>;
  findOne(id: string): Promise<GradeLevelResponseDTO>;
  update(
    id: string,
    dto: UpdateGradeLevelRequestDTO,
  ): Promise<GradeLevelResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminMajorController {
  create(dto: CreateMajorRequestDTO): Promise<MajorResponseDTO>;
  findAll(facultyId?: string): Promise<MajorResponseDTO[]>;
  findOne(id: string): Promise<MajorResponseDTO>;
  update(id: string, dto: UpdateMajorRequestDTO): Promise<MajorResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminFacultyController {
  create(dto: CreateFacultyRequestDTO): Promise<FacultyResponseDTO>;
  findAll(): Promise<FacultyResponseDTO[]>;
  findOne(id: string): Promise<FacultyResponseDTO>;
  update(id: string, dto: UpdateFacultyRequestDTO): Promise<FacultyResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminProgrammingCategoryController {
  create(
    dto: CreateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO>;
  findAll(): Promise<ProgrammingCategoryResponseDTO[]>;
  findOne(id: string): Promise<ProgrammingCategoryResponseDTO>;
  update(
    id: string,
    dto: UpdateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}
