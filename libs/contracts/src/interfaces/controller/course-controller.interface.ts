/**
 * RPC controller contracts for course-service — one per resource domain.
 * Payloads are validated at the gateway, so they arrive here as `unknown`.
 */

export interface ICourseRpcController {
  create(payload: unknown): Promise<unknown>;
  findAll(): Promise<unknown>;
  findPublished(): Promise<unknown>;
  findOne(payload: unknown): Promise<unknown>;
  findBySlug(payload: unknown): Promise<unknown>;
  findBySubject(payload: unknown): Promise<unknown>;
  findByGrade(payload: unknown): Promise<unknown>;
  findByMajor(payload: unknown): Promise<unknown>;
  findByCategory(payload: unknown): Promise<unknown>;
  update(payload: unknown): Promise<unknown>;
  remove(payload: unknown): Promise<unknown>;
  publish(payload: unknown): Promise<unknown>;
  unpublish(payload: unknown): Promise<unknown>;
}

export interface IEnrollmentRpcController {
  enroll(payload: unknown): Promise<unknown>;
  unenroll(payload: unknown): Promise<unknown>;
  findByUser(payload: unknown): Promise<unknown>;
  findByCourse(payload: unknown): Promise<unknown>;
  check(payload: unknown): Promise<unknown>;
}

export interface IFacultyRpcController {
  create(payload: unknown): Promise<unknown>;
  findAll(): Promise<unknown>;
  findOne(payload: unknown): Promise<unknown>;
  findBySlug(payload: unknown): Promise<unknown>;
  update(payload: unknown): Promise<unknown>;
  remove(payload: unknown): Promise<unknown>;
}

export interface IGradeLevelRpcController {
  create(payload: unknown): Promise<unknown>;
  findAll(): Promise<unknown>;
  findOne(payload: unknown): Promise<unknown>;
  update(payload: unknown): Promise<unknown>;
  remove(payload: unknown): Promise<unknown>;
}

export interface ILessonRpcController {
  create(payload: unknown): Promise<unknown>;
  findAll(payload: unknown): Promise<unknown>;
  findOne(payload: unknown): Promise<unknown>;
  findBySlug(payload: unknown): Promise<unknown>;
  update(payload: unknown): Promise<unknown>;
  remove(payload: unknown): Promise<unknown>;
  reorder(payload: unknown): Promise<unknown>;
}

export interface ILessonProgressRpcController {
  markComplete(payload: unknown): Promise<unknown>;
  findByUser(payload: unknown): Promise<unknown>;
  findByLesson(payload: unknown): Promise<unknown>;
  calculate(payload: unknown): Promise<unknown>;
}

export interface IMajorRpcController {
  create(payload: unknown): Promise<unknown>;
  findAll(payload: unknown): Promise<unknown>;
  findOne(payload: unknown): Promise<unknown>;
  findBySlug(payload: unknown): Promise<unknown>;
  update(payload: unknown): Promise<unknown>;
  remove(payload: unknown): Promise<unknown>;
}

export interface IModuleRpcController {
  create(payload: unknown): Promise<unknown>;
  findAll(payload: unknown): Promise<unknown>;
  findOne(payload: unknown): Promise<unknown>;
  update(payload: unknown): Promise<unknown>;
  remove(payload: unknown): Promise<unknown>;
  reorder(payload: unknown): Promise<unknown>;
}

export interface IProgrammingCategoryRpcController {
  create(payload: unknown): Promise<unknown>;
  findAll(): Promise<unknown>;
  findOne(payload: unknown): Promise<unknown>;
  findBySlug(payload: unknown): Promise<unknown>;
  update(payload: unknown): Promise<unknown>;
  remove(payload: unknown): Promise<unknown>;
}

export interface ISubjectRpcController {
  create(payload: unknown): Promise<unknown>;
  findAll(): Promise<unknown>;
  findOne(payload: unknown): Promise<unknown>;
  findBySlug(payload: unknown): Promise<unknown>;
  update(payload: unknown): Promise<unknown>;
  remove(payload: unknown): Promise<unknown>;
}
