export const COURSE_SERVICE = {
  NAME: 'COURSE_SERVICE',
  ACTIONS: {
    // Subjects (K–12 taxonomy)
    SUBJECT_CREATE: 'course.subject.create',
    SUBJECT_FIND_ALL: 'course.subject.find_all',
    SUBJECT_FIND_ONE: 'course.subject.find_one',
    SUBJECT_FIND_BY_SLUG: 'course.subject.find_by_slug',
    SUBJECT_UPDATE: 'course.subject.update',
    SUBJECT_DELETE: 'course.subject.delete',

    // Grade levels (K–12, Grade 1–12)
    GRADE_LEVEL_CREATE: 'course.grade_level.create',
    GRADE_LEVEL_FIND_ALL: 'course.grade_level.find_all',
    GRADE_LEVEL_FIND_ONE: 'course.grade_level.find_one',
    GRADE_LEVEL_UPDATE: 'course.grade_level.update',
    GRADE_LEVEL_DELETE: 'course.grade_level.delete',

    // Faculties (university)
    FACULTY_CREATE: 'course.faculty.create',
    FACULTY_FIND_ALL: 'course.faculty.find_all',
    FACULTY_FIND_ONE: 'course.faculty.find_one',
    FACULTY_FIND_BY_SLUG: 'course.faculty.find_by_slug',
    FACULTY_UPDATE: 'course.faculty.update',
    FACULTY_DELETE: 'course.faculty.delete',

    // Majors (university)
    MAJOR_CREATE: 'course.major.create',
    MAJOR_FIND_ALL: 'course.major.find_all', // optional ?facultyId
    MAJOR_FIND_ONE: 'course.major.find_one',
    MAJOR_FIND_BY_SLUG: 'course.major.find_by_slug',
    MAJOR_UPDATE: 'course.major.update',
    MAJOR_DELETE: 'course.major.delete',

    // Programming categories (programming track taxonomy)
    PROGRAMMING_CATEGORY_CREATE: 'course.programming_category.create',
    PROGRAMMING_CATEGORY_FIND_ALL: 'course.programming_category.find_all',
    PROGRAMMING_CATEGORY_FIND_ONE: 'course.programming_category.find_one',
    PROGRAMMING_CATEGORY_FIND_BY_SLUG:
      'course.programming_category.find_by_slug',
    PROGRAMMING_CATEGORY_UPDATE: 'course.programming_category.update',
    PROGRAMMING_CATEGORY_DELETE: 'course.programming_category.delete',

    // Courses
    COURSE_CREATE: 'course.course.create',
    COURSE_FIND_ALL: 'course.course.find_all', // all (admin)
    COURSE_FIND_PUBLISHED: 'course.course.find_published', // published only (public)
    COURSE_SEARCH: 'course.course.search', // keyword search over published courses
    COURSE_FIND_ONE: 'course.course.find_one',
    COURSE_FIND_BY_SLUG: 'course.course.find_by_slug',
    COURSE_FIND_BY_SUBJECT: 'course.course.find_by_subject',
    COURSE_FIND_BY_GRADE: 'course.course.find_by_grade',
    COURSE_FIND_BY_MAJOR: 'course.course.find_by_major',
    COURSE_FIND_BY_CATEGORY: 'course.course.find_by_category',
    COURSE_UPDATE: 'course.course.update',
    COURSE_DELETE: 'course.course.delete',
    COURSE_PUBLISH: 'course.course.publish',
    COURSE_UNPUBLISH: 'course.course.unpublish',

    // Modules
    MODULE_CREATE: 'course.module.create',
    MODULE_FIND_ALL: 'course.module.find_all', // by courseId
    MODULE_FIND_ONE: 'course.module.find_one',
    MODULE_UPDATE: 'course.module.update',
    MODULE_DELETE: 'course.module.delete',
    MODULE_REORDER: 'course.module.reorder',

    // Lessons
    LESSON_CREATE: 'course.lesson.create',
    LESSON_FIND_ALL: 'course.lesson.find_all', // by moduleId
    LESSON_FIND_ONE: 'course.lesson.find_one',
    LESSON_FIND_BY_SLUG: 'course.lesson.find_by_slug',
    LESSON_UPDATE: 'course.lesson.update',
    LESSON_DELETE: 'course.lesson.delete',
    LESSON_REORDER: 'course.lesson.reorder',

    // Enrollments
    ENROLL: 'course.enrollment.enroll',
    UNENROLL: 'course.enrollment.unenroll',
    ENROLLMENT_FIND_BY_USER: 'course.enrollment.find_by_user',
    ENROLLMENT_FIND_BY_COURSE: 'course.enrollment.find_by_course',
    ENROLLMENT_CHECK: 'course.enrollment.check', // is user enrolled?

    // Lesson Progress
    PROGRESS_MARK_COMPLETE: 'course.progress.mark_complete',
    PROGRESS_FIND_BY_USER: 'course.progress.find_by_user',
    PROGRESS_FIND_BY_LESSON: 'course.progress.find_by_lesson',
    PROGRESS_CALCULATE: 'course.progress.calculate', // recalculate enrollment %
  },
};
