export const COURSE_SERVICE = {
  NAME: 'COURSE_SERVICE',
  ACTIONS: {
    // Categories
    CATEGORY_CREATE: 'course.category.create',
    CATEGORY_FIND_ALL: 'course.category.find_all',
    CATEGORY_FIND_ONE: 'course.category.find_one',
    CATEGORY_FIND_BY_SLUG: 'course.category.find_by_slug',
    CATEGORY_UPDATE: 'course.category.update',
    CATEGORY_DELETE: 'course.category.delete',

    // Courses
    COURSE_CREATE: 'course.course.create',
    COURSE_FIND_ALL: 'course.course.find_all', // all (admin)
    COURSE_FIND_PUBLISHED: 'course.course.find_published', // published only (public)
    COURSE_FIND_ONE: 'course.course.find_one',
    COURSE_FIND_BY_SLUG: 'course.course.find_by_slug',
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
