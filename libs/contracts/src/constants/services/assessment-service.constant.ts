export const ASSESSMENT_SERVICE = {
  NAME: 'ASSESSMENT_SERVICE',
  ACTIONS: {
    // Quizzes
    QUIZ_CREATE: 'assessment.quiz.create',
    QUIZ_FIND_ALL: 'assessment.quiz.find_all', // by lessonId
    QUIZ_FIND_ONE: 'assessment.quiz.find_one',
    QUIZ_UPDATE: 'assessment.quiz.update',
    QUIZ_DELETE: 'assessment.quiz.delete',

    // Quiz Questions
    QUESTION_CREATE: 'assessment.question.create',
    QUESTION_FIND_ALL: 'assessment.question.find_all', // by quizId
    QUESTION_UPDATE: 'assessment.question.update',
    QUESTION_DELETE: 'assessment.question.delete',
    QUESTION_REORDER: 'assessment.question.reorder',

    // Quiz Options
    OPTION_CREATE: 'assessment.option.create',
    OPTION_FIND_ALL: 'assessment.option.find_all', // by questionId
    OPTION_UPDATE: 'assessment.option.update',
    OPTION_DELETE: 'assessment.option.delete',

    // Quiz Attempts
    ATTEMPT_START: 'assessment.attempt.start',
    ATTEMPT_SUBMIT: 'assessment.attempt.submit',
    ATTEMPT_FIND_ALL: 'assessment.attempt.find_all', // by userId
    ATTEMPT_FIND_ONE: 'assessment.attempt.find_one',
    ATTEMPT_FIND_BY_QUIZ: 'assessment.attempt.find_by_quiz',

    // Quiz Attempt Answers
    ATTEMPT_ANSWER_FIND_ALL: 'assessment.attempt_answer.find_all', // by attemptId

    // Coding Challenges
    CHALLENGE_CREATE: 'assessment.challenge.create',
    CHALLENGE_FIND_ALL: 'assessment.challenge.find_all', // by lessonId
    CHALLENGE_FIND_ONE: 'assessment.challenge.find_one',
    CHALLENGE_UPDATE: 'assessment.challenge.update',
    CHALLENGE_DELETE: 'assessment.challenge.delete',

    // Test Cases
    TEST_CASE_CREATE: 'assessment.test_case.create',
    TEST_CASE_FIND_ALL: 'assessment.test_case.find_all', // by challengeId (visible only)
    TEST_CASE_UPDATE: 'assessment.test_case.update',
    TEST_CASE_DELETE: 'assessment.test_case.delete',

    // Submissions
    SUBMISSION_CREATE: 'assessment.submission.create', // runs code + grades
    SUBMISSION_FIND_ALL: 'assessment.submission.find_all', // by userId
    SUBMISSION_FIND_BY_CHALLENGE: 'assessment.submission.find_by_challenge',
    SUBMISSION_FIND_ONE: 'assessment.submission.find_one',
  },
};
