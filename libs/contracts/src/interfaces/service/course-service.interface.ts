/**
 * DI tokens + service contracts for course-service. Controllers depend on
 * these; the module binds each concrete implementation.
 *
 * Signatures are intentionally loose (`...args`, `Promise<unknown>`): these
 * resolve to Drizzle row shapes re-typed at the gateway via `rpcCall<T>`, so
 * pinning them here would only duplicate the inferred query types.
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
  create(...args: any[]): Promise<unknown>;
  findAll(...args: any[]): Promise<unknown>;
  findPublished(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  findBySlug(...args: any[]): Promise<unknown>;
  findBySubject(...args: any[]): Promise<unknown>;
  findByGrade(...args: any[]): Promise<unknown>;
  findByMajor(...args: any[]): Promise<unknown>;
  findByCategory(...args: any[]): Promise<unknown>;
  update(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
  setPublished(...args: any[]): Promise<unknown>;
}

export interface IEnrollmentService {
  enroll(...args: any[]): Promise<unknown>;
  unenroll(...args: any[]): Promise<unknown>;
  findByUser(...args: any[]): Promise<unknown>;
  findByCourse(...args: any[]): Promise<unknown>;
  check(...args: any[]): Promise<unknown>;
}

export interface IFacultyService {
  create(...args: any[]): Promise<unknown>;
  findAll(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  findBySlug(...args: any[]): Promise<unknown>;
  update(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
}

export interface IGradeLevelService {
  create(...args: any[]): Promise<unknown>;
  findAll(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  update(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
}

export interface ILessonService {
  create(...args: any[]): Promise<unknown>;
  findAllByModule(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  findBySlug(...args: any[]): Promise<unknown>;
  update(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
  reorder(...args: any[]): Promise<unknown>;
}

export interface ILessonProgressService {
  markComplete(...args: any[]): Promise<unknown>;
  findByUser(...args: any[]): Promise<unknown>;
  findByLesson(...args: any[]): Promise<unknown>;
  recalculate(...args: any[]): Promise<unknown>;
}

export interface IMajorService {
  create(...args: any[]): Promise<unknown>;
  findAll(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  findBySlug(...args: any[]): Promise<unknown>;
  update(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
}

export interface IModuleService {
  create(...args: any[]): Promise<unknown>;
  findAllByCourse(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  update(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
  reorder(...args: any[]): Promise<unknown>;
}

export interface IProgrammingCategoryService {
  create(...args: any[]): Promise<unknown>;
  findAll(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  findBySlug(...args: any[]): Promise<unknown>;
  update(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
}

export interface ISubjectService {
  create(...args: any[]): Promise<unknown>;
  findAll(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  findBySlug(...args: any[]): Promise<unknown>;
  update(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
}
