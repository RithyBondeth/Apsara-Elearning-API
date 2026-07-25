// Seeds reference data + demo content for local development.
// Idempotent: reference data is upserted, demo rows are cleared and re-inserted.
// Run with: npm run seed
import 'dotenv/config';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { MATH_GRADE_12 } from './content/math-grade-12.mjs';
import { MATH_GRADE_12_BASIC } from './content/math-grade-12-basic.mjs';
import { MATH_GRADE_12_PRACTICE } from './content/math-grade-12-practice.mjs';
import { MATH_GRADE_12_DETAIL } from './content/math-grade-12-detail.mjs';
import { MATH_GRADE_12_GRAPHS } from './content/math-grade-12-graphs.mjs';
import { MATH_GRADE_12_PRACTICE_2 } from './content/math-grade-12-practice-2.mjs';
import { MATH_GRADE_12_DETAIL_2 } from './content/math-grade-12-detail-2.mjs';

/** Key-points heading that closes each maths lesson — the detail supplement
 *  is inserted just before it so the summary stays last. */
const KEY_POINTS_HEADING = '### ចំណុចសំខាន់ត្រូវចងចាំ';

/** Deepens a lesson with its detail supplement (extra worked example + common
 *  mistakes), placed before the key-points summary. No-op without a supplement. */
function withDetail(slug, content) {
  const detail = MATH_GRADE_12_DETAIL[slug];
  if (!detail) return content;
  return content.includes(KEY_POINTS_HEADING)
    ? content.replace(KEY_POINTS_HEADING, `${detail}\n\n${KEY_POINTS_HEADING}`)
    : `${content}\n\n${detail}`;
}

/** Inserts a lesson's third worked example (detail-2) before the key-points
 *  summary, after the first detail supplement. No-op without one. */
function withDetail2(slug, content) {
  const detail = MATH_GRADE_12_DETAIL_2[slug];
  if (!detail) return content;
  return content.includes(KEY_POINTS_HEADING)
    ? content.replace(KEY_POINTS_HEADING, `${detail}\n\n${KEY_POINTS_HEADING}`)
    : `${content}\n\n${detail}`;
}

/** Inserts a lesson's SVG graph supplement (```graph blocks) just before the
 *  key-points summary, after any detail supplement. No-op without a graph. */
function withGraph(slug, content) {
  const graph = MATH_GRADE_12_GRAPHS[slug];
  if (!graph) return content;
  return content.includes(KEY_POINTS_HEADING)
    ? content.replace(KEY_POINTS_HEADING, `${graph}\n\n${KEY_POINTS_HEADING}`)
    : `${content}\n\n${graph}`;
}

const sql = postgres(process.env.DATABASE_URL);
const saltRounds = parseInt(process.env.BCRYPT_SALT ?? '10', 10);

const ADMIN = { email: 'admin@apsara-elearning.com', password: 'Admin@123' };
const STUDENT = {
  email: 'student@apsara-elearning.com',
  password: 'Student@123',
};
const COURSE_SLUG = 'intro-to-javascript';

// XP-threshold badges — user-service auto-awards these when addXp crosses
// xpRequired. Icons are lucide slugs the web frontend maps to components.
const BADGES = [
  ['First Steps', 'Earned your first 10 XP', 'trophy', 10],
  ['Quick Learner', 'Reached 50 XP', 'zap', 50],
  ['Rising Star', 'Reached 100 XP', 'star', 100],
  ['Dedicated', 'Reached 250 XP', 'flame', 250],
  ['Scholar', 'Reached 500 XP', 'medal', 500],
  ['Master', 'Reached 1,000 XP', 'crown', 1000],
];
const BADGE_NAMES = BADGES.map(([name]) => name);

// Slugs of every course this script owns — cleared and re-created each run.
// 'math' / 'english' / 'python' / 'react' / 'algorithms' are chosen to match
// the slugs the web frontend already references (catalog.constant.ts,
// course-content.constant.ts) so wiring up the real API needs no remapping.
const DEMO_COURSE_SLUGS = [
  COURSE_SLUG,
  'math',
  'math-basic',
  'english',
  'python',
  'react',
  'algorithms',
];

// Cambodia's K–12 structure: primary 1–6, lower secondary 7–9, upper secondary 10–12.
const KHMER_NUMERALS = [
  '១',
  '២',
  '៣',
  '៤',
  '៥',
  '៦',
  '៧',
  '៨',
  '៩',
  '១០',
  '១១',
  '១២',
];
const stageFor = (grade) =>
  grade <= 6 ? 'primary' : grade <= 9 ? 'lower_secondary' : 'upper_secondary';

const SUBJECTS = [
  ['Mathematics', 'គណិតវិទ្យា', 'mathematics', 'calculator'],
  ['Khmer Language', 'ភាសាខ្មែរ', 'khmer-language', 'book-open'],
  ['English', 'ភាសាអង់គ្លេស', 'english', 'languages'],
  ['Physics', 'រូបវិទ្យា', 'physics', 'atom'],
  ['Chemistry', 'គីមីវិទ្យា', 'chemistry', 'flask-conical'],
  ['Biology', 'ជីវវិទ្យា', 'biology', 'leaf'],
  ['History', 'ប្រវត្តិវិទ្យា', 'history', 'landmark'],
  ['Geography', 'ភូមិវិទ្យា', 'geography', 'globe'],
  ['Information Technology', 'ព័ត៌មានវិទ្យា', 'information-technology', 'code'],
];

// Placement taxonomy for the 'programming' track — flat, like SUBJECTS.
// `slug` mirrors PROGRAMMING_CATEGORIES in the web app's catalog.constant.ts.
const PROGRAMMING_CATEGORIES = [
  [
    'Programming Fundamentals',
    'មូលដ្ឋានគ្រឹះកម្មវិធី',
    'programming-fundamentals',
    'terminal',
  ],
  ['Web Development', 'ការអភិវឌ្ឍន៍គេហទំព័រ', 'web-development', 'globe'],
  [
    'Mobile App Development',
    'ការអភិវឌ្ឍន៍កម្មវិធីទូរស័ព្ទ',
    'mobile-app-development',
    'smartphone',
  ],
  [
    'Data Science & AI',
    'វិទ្យាសាស្ត្រទិន្នន័យ និង AI',
    'data-science-ai',
    'brain',
  ],
  ['Computer Science', 'វិទ្យាសាស្ត្រកុំព្យូទ័រ', 'computer-science', 'binary'],
  ['Game Development', 'ការអភិវឌ្ឍន៍ហ្គេម', 'game-development', 'gamepad-2'],
  ['DevOps & Cloud', 'DevOps និង Cloud', 'devops-cloud', 'cloud'],
  ['Cybersecurity', 'សន្តិសុខតាមអ៊ីនធឺណិត', 'cybersecurity', 'shield-check'],
];

async function clearDemo() {
  // Courses cascade to modules → lessons → quizzes/questions/options and
  // challenges/test-cases. Delete those roots, then standalone rows.
  await sql`DELETE FROM courses WHERE slug = ANY(${DEMO_COURSE_SLUGS})`;
  await sql`DELETE FROM badges WHERE name = ANY(${BADGE_NAMES})`;
  await sql`DELETE FROM users WHERE email IN (${ADMIN.email}, ${STUDENT.email})`;
}

async function seedGradeLevels() {
  const ids = {};
  for (let grade = 1; grade <= 12; grade++) {
    const [row] = await sql`
      INSERT INTO grade_levels (stage, grade, name, name_km, "order")
      VALUES (${stageFor(grade)}, ${grade}, ${'Grade ' + grade},
              ${'ថ្នាក់ទី' + KHMER_NUMERALS[grade - 1]}, ${grade})
      ON CONFLICT (grade) DO UPDATE
        SET stage = EXCLUDED.stage, name = EXCLUDED.name,
            name_km = EXCLUDED.name_km, "order" = EXCLUDED."order",
            updated_at = now()
      RETURNING id`;
    ids[grade] = row.id;
  }
  return ids;
}

async function seedSubjects() {
  const ids = {};
  for (const [name, nameKm, slug, icon] of SUBJECTS) {
    const [row] = await sql`
      INSERT INTO subjects (name, name_km, slug, icon)
      VALUES (${name}, ${nameKm}, ${slug}, ${icon})
      ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name, name_km = EXCLUDED.name_km,
            icon = EXCLUDED.icon, updated_at = now()
      RETURNING id`;
    ids[slug] = row.id;
  }
  return ids;
}

async function seedProgrammingCategories() {
  const ids = {};
  for (const [name, nameKm, slug, icon] of PROGRAMMING_CATEGORIES) {
    const [row] = await sql`
      INSERT INTO programming_categories (name, name_km, slug, icon)
      VALUES (${name}, ${nameKm}, ${slug}, ${icon})
      ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name, name_km = EXCLUDED.name_km,
            icon = EXCLUDED.icon, updated_at = now()
      RETURNING id`;
    ids[slug] = row.id;
  }
  return ids;
}

async function seedUniversity() {
  const [faculty] = await sql`
    INSERT INTO faculties (name, name_km, slug, description, icon)
    VALUES ('Faculty of Engineering', 'មហាវិទ្យាល័យវិស្វកម្ម', 'engineering',
            'Engineering disciplines and programs', 'cpu')
    ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, name_km = EXCLUDED.name_km, updated_at = now()
    RETURNING id`;
  const [major] = await sql`
    INSERT INTO majors (faculty_id, name, name_km, slug, description)
    VALUES (${faculty.id}, 'Computer Science', 'វិទ្យាសាស្ត្រកុំព្យូទ័រ',
            'computer-science', 'Software, algorithms and systems')
    ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id, updated_at = now()
    RETURNING id`;
  return { facultyId: faculty.id, majorId: major.id };
}

/** Course + one module + its lessons, in the shape every demo course beyond
 *  the original JS course shares. Returns the new course's id. */
async function createCourseWithLessons({
  programType,
  subjectId,
  gradeLevelId,
  categoryId,
  title,
  titleKm,
  slug,
  description,
  difficulty,
  estimatedHours,
  moduleTitle,
  lessons,
}) {
  const [course] = await sql`
    INSERT INTO courses (program_type, subject_id, grade_level_id, category_id,
                         title, title_km, slug, description, difficulty,
                         estimated_hours, published)
    VALUES (${programType}, ${subjectId ?? null}, ${gradeLevelId ?? null},
            ${categoryId ?? null}, ${title}, ${titleKm}, ${slug},
            ${description}, ${difficulty}, ${estimatedHours}, true)
    RETURNING id`;

  const [mod] = await sql`
    INSERT INTO modules (course_id, title, description, "order")
    VALUES (${course.id}, ${moduleTitle}, ${moduleTitle}, 0)
    RETURNING id`;

  let order = 0;
  for (const lesson of lessons) {
    await sql`
      INSERT INTO lessons (module_id, title, slug, type, content, "order", estimated_minutes)
      VALUES (${mod.id}, ${lesson.title}, ${lesson.slug}, 'article',
              ${lesson.content}, ${order}, ${lesson.minutes})`;
    order++;
  }

  return course.id;
}

/** A full authored course: many modules, each with lessons, each lesson
 *  optionally carrying a quiz. Takes the curriculum objects in scripts/content/.
 *  Returns counts so the summary can report what actually landed.
 *
 *  Writes are row-by-row on purpose — the driver has no interactive
 *  transactions, so there is nothing to batch them into. */
async function createFullCourse(curriculum, { subjectId, gradeLevelId }) {
  const [course] = await sql`
    INSERT INTO courses (program_type, subject_id, grade_level_id,
                         title, title_km, slug, description, description_km,
                         difficulty, estimated_hours, published)
    VALUES (${curriculum.programType}, ${subjectId ?? null}, ${gradeLevelId ?? null},
            ${curriculum.title}, ${curriculum.title}, ${curriculum.slug},
            ${curriculum.description}, ${curriculum.description},
            ${curriculum.difficulty}, ${curriculum.estimatedHours}, true)
    RETURNING id`;

  const counts = { modules: 0, lessons: 0, quizzes: 0, questions: 0 };

  let moduleOrder = 0;
  for (const mod of curriculum.modules) {
    const [moduleRow] = await sql`
      INSERT INTO modules (course_id, title, description, "order")
      VALUES (${course.id}, ${mod.title}, ${mod.description ?? null}, ${moduleOrder})
      RETURNING id`;
    counts.modules++;
    moduleOrder++;

    let lessonOrder = 0;
    for (const lesson of mod.lessons) {
      const [lessonRow] = await sql`
        INSERT INTO lessons (module_id, title, slug, type, content, "order", estimated_minutes)
        VALUES (${moduleRow.id}, ${lesson.title}, ${lesson.slug}, 'article',
                ${withGraph(lesson.slug, withDetail2(lesson.slug, withDetail(lesson.slug, lesson.content)))}, ${lessonOrder}, ${lesson.minutes})
        RETURNING id`;
      counts.lessons++;
      lessonOrder++;

      if (!lesson.quiz) continue;

      const [quizRow] = await sql`
        INSERT INTO quizzes (lesson_id, title, description, xp_reward)
        VALUES (${lessonRow.id}, ${lesson.quiz.title},
                ${lesson.quiz.description ?? null}, ${lesson.quiz.xpReward ?? 25})
        RETURNING id`;
      counts.quizzes++;

      // Extra practice questions (math G12) are appended by lesson slug so every
      // quiz reaches ~9 questions; undefined for lessons without extras.
      const questions = [
        ...lesson.quiz.questions,
        ...(MATH_GRADE_12_PRACTICE[lesson.slug] ?? []),
        ...(MATH_GRADE_12_PRACTICE_2[lesson.slug] ?? []),
      ];

      let questionOrder = 0;
      for (const q of questions) {
        const [questionRow] = await sql`
          INSERT INTO quiz_questions (quiz_id, type, question, correct_answer,
                                      explanation, points, "order")
          VALUES (${quizRow.id}, ${q.type}, ${q.question},
                  ${q.correctAnswer ? JSON.stringify(q.correctAnswer) : null}::jsonb,
                  ${q.explanation ?? null}, ${q.points ?? 1}, ${questionOrder})
          RETURNING id`;
        counts.questions++;
        questionOrder++;

        // multiple_choice keeps its answer key on quiz_options, not correct_answer.
        for (const [answer, isCorrect] of q.options ?? []) {
          await sql`
            INSERT INTO quiz_options (question_id, answer, is_correct)
            VALUES (${questionRow.id}, ${answer}, ${isCorrect})`;
        }
      }
    }
  }

  return counts;
}

async function seed() {
  console.log('Seeding reference data…');
  const gradeIds = await seedGradeLevels();
  const subjectIds = await seedSubjects();
  const categoryIds = await seedProgrammingCategories();
  const { majorId } = await seedUniversity();
  console.log(
    `  ${Object.keys(gradeIds).length} grade levels, ${Object.keys(subjectIds).length} subjects, ` +
      `${Object.keys(categoryIds).length} programming categories, 1 faculty + 1 major.`,
  );

  console.log('Clearing previous demo data…');
  await clearDemo();

  console.log('Creating users…');
  const adminHash = await bcrypt.hash(ADMIN.password, saltRounds);
  const studentHash = await bcrypt.hash(STUDENT.password, saltRounds);
  await sql`INSERT INTO users (email, password, first_name, last_name, is_email_verified, is_admin)
            VALUES (${ADMIN.email}, ${adminHash}, 'Admin', 'User', true, true)`;
  await sql`INSERT INTO users (email, password, first_name, last_name, is_email_verified, is_admin)
            VALUES (${STUDENT.email}, ${studentHash}, 'Demo', 'Student', true, false)`;

  console.log('Creating demo course…');
  const [course] = await sql`
    INSERT INTO courses (program_type, subject_id, grade_level_id, title, title_km, slug,
                         description, difficulty, estimated_hours, published)
    VALUES ('k12', ${subjectIds['information-technology']}, ${gradeIds[10]},
            'Intro to JavaScript', 'ការណែនាំអំពី JavaScript', ${COURSE_SLUG},
            'JavaScript fundamentals for absolute beginners', 'beginner', 8, true)
    RETURNING id`;

  console.log('Creating module + lessons…');
  const [module] = await sql`
    INSERT INTO modules (course_id, title, description, "order")
    VALUES (${course.id}, 'Getting Started', 'Setup and the basics', 0)
    RETURNING id`;
  const [lesson1] = await sql`
    INSERT INTO lessons (module_id, title, slug, type, content, "order", estimated_minutes)
    VALUES (${module.id}, 'Variables and Types', 'variables-and-types', 'article',
            '# Variables\n\nUse const and let to declare variables…', 0, 15)
    RETURNING id`;
  const [lesson2] = await sql`
    INSERT INTO lessons (module_id, title, slug, type, content, "order", estimated_minutes)
    VALUES (${module.id}, 'Functions', 'functions', 'article',
            '# Functions\n\nFunctions are reusable blocks…', 1, 20)
    RETURNING id`;

  console.log('Creating quiz (multiple-choice + numeric)…');
  const [quiz] = await sql`
    INSERT INTO quizzes (lesson_id, title, description, xp_reward)
    VALUES (${lesson1.id}, 'Variables Quiz', 'Check your understanding of variables', 25)
    RETURNING id`;
  const [q1] = await sql`
    INSERT INTO quiz_questions (quiz_id, type, question, explanation, points, "order")
    VALUES (${quiz.id}, 'multiple_choice', 'Which keyword declares a constant in JS?',
            'const creates a read-only binding.', 1, 0)
    RETURNING id`;
  await sql`INSERT INTO quiz_options (question_id, answer, is_correct) VALUES
    (${q1.id}, 'const', true), (${q1.id}, 'var', false), (${q1.id}, 'let', false)`;
  // Exercises the generalized grader: auto-graded with a numeric tolerance.
  await sql`
    INSERT INTO quiz_questions (quiz_id, type, question, correct_answer, explanation, points, "order")
    VALUES (${quiz.id}, 'numeric', 'What does 12 / 8 evaluate to in JavaScript?',
            ${JSON.stringify({ value: 1.5, tolerance: 0.01 })}::jsonb,
            'JavaScript division returns a float, not an integer.', 2, 1)`;

  console.log('Creating coding challenge…');
  const [challenge] = await sql`
    INSERT INTO coding_challenges (lesson_id, title, description, starter_code, solution_code, xp_reward)
    VALUES (${lesson2.id}, 'Sum two numbers',
            'Read two integers from stdin and print their sum.',
            'const [a, b] = input.split(" ").map(Number);\n// print a + b',
            'const [a, b] = input.split(" ").map(Number);\nconsole.log(a + b);', 50)
    RETURNING id`;
  await sql`INSERT INTO challenge_test_cases (challenge_id, input, expected_output, is_hidden, "order") VALUES
    (${challenge.id}, '2 3', '5', false, 0),
    (${challenge.id}, '10 20', '30', true, 1)`;

  // Grade 12 maths ships as two separate courses, mirroring the MoEYS
  // two-book structure: the "Basic" (មូលដ្ឋាន) track and the "Advanced"
  // (កម្រិតខ្ពស់) track. They share the Mathematics subject / Grade 12 but have
  // distinct slugs, so the web catalog lists them as two courses.
  console.log('Creating Grade 12 Mathematics — Advanced track (full Khmer curriculum)…');
  const mathCounts = await createFullCourse(MATH_GRADE_12, {
    subjectId: subjectIds[MATH_GRADE_12.subjectSlug],
    gradeLevelId: gradeIds[MATH_GRADE_12.grade],
  });
  console.log(
    `  ${mathCounts.modules} modules, ${mathCounts.lessons} lessons, ` +
      `${mathCounts.quizzes} quizzes, ${mathCounts.questions} questions.`,
  );

  console.log('Creating Grade 12 Mathematics — Basic track (មូលដ្ឋាន)…');
  const mathBasicCounts = await createFullCourse(MATH_GRADE_12_BASIC, {
    subjectId: subjectIds[MATH_GRADE_12_BASIC.subjectSlug],
    gradeLevelId: gradeIds[MATH_GRADE_12_BASIC.grade],
  });
  console.log(
    `  ${mathBasicCounts.modules} modules, ${mathBasicCounts.lessons} lessons, ` +
      `${mathBasicCounts.quizzes} quizzes, ${mathBasicCounts.questions} questions.`,
  );

  console.log('Creating catalog demo courses (k12 + programming)…');
  await createCourseWithLessons({
    programType: 'k12',
    subjectId: subjectIds['english'],
    gradeLevelId: gradeIds[12],
    title: 'English',
    titleKm: 'ភាសាអង់គ្លេស',
    slug: 'english',
    description: 'Grammar, reading comprehension, and exam writing skills.',
    difficulty: 'beginner',
    estimatedHours: 30,
    moduleTitle: 'Grammar Essentials',
    lessons: [
      {
        title: 'Tenses Overview',
        slug: 'tenses-overview',
        minutes: 20,
        content: '# Tenses\n\nPast, present, and future forms…',
      },
      {
        title: 'Reading Comprehension',
        slug: 'reading-comprehension',
        minutes: 25,
        content: '# Reading\n\nStrategies for exam passages…',
      },
    ],
  });
  await createCourseWithLessons({
    programType: 'programming',
    categoryId: categoryIds['programming-fundamentals'],
    title: 'Python Fundamentals',
    titleKm: 'មូលដ្ឋានគ្រឹះ Python',
    slug: 'python',
    description:
      'Learn Python from scratch — variables, loops, functions, and object-oriented programming.',
    difficulty: 'beginner',
    estimatedHours: 12,
    moduleTitle: 'Getting Started',
    lessons: [
      {
        title: 'What is Python?',
        slug: 'what-is-python',
        minutes: 10,
        content: '# Python\n\nA high-level, readable programming language…',
      },
      {
        title: 'Variables & Data Types',
        slug: 'variables-data-types',
        minutes: 15,
        content: '# Variables\n\nint, float, str, bool…',
      },
      {
        title: 'Loops',
        slug: 'loops',
        minutes: 15,
        content: '# Loops\n\nfor and while…',
      },
      {
        title: 'Functions',
        slug: 'functions',
        minutes: 20,
        content: '# Functions\n\ndef and return…',
      },
    ],
  });
  await createCourseWithLessons({
    programType: 'programming',
    categoryId: categoryIds['web-development'],
    title: 'Web Dev with React',
    titleKm: 'បង្កើតគេហទំព័រ React',
    slug: 'react',
    description:
      'Build modern web applications with React components, hooks, and state management.',
    difficulty: 'intermediate',
    estimatedHours: 16,
    moduleTitle: 'React Basics',
    lessons: [
      {
        title: 'Components & JSX',
        slug: 'components-and-jsx',
        minutes: 20,
        content: '# Components\n\nJSX is JavaScript + XML…',
      },
      {
        title: 'Props',
        slug: 'props',
        minutes: 15,
        content: '# Props\n\nPassing data into components…',
      },
      {
        title: 'useState Hook',
        slug: 'use-state-hook',
        minutes: 20,
        content: '# useState\n\nComponent-local state…',
      },
      {
        title: 'useEffect Hook',
        slug: 'use-effect-hook',
        minutes: 20,
        content: '# useEffect\n\nSide effects and lifecycle…',
      },
    ],
  });
  await createCourseWithLessons({
    programType: 'programming',
    categoryId: categoryIds['computer-science'],
    title: 'Algorithms & DSA',
    titleKm: 'ក្បួនដោះស្រាយ & DSA',
    slug: 'algorithms',
    description:
      'Master data structures and algorithms — arrays, trees, sorting, and dynamic programming.',
    difficulty: 'advanced',
    estimatedHours: 20,
    moduleTitle: 'Foundations',
    lessons: [
      {
        title: 'Big-O Notation',
        slug: 'big-o-notation',
        minutes: 20,
        content: '# Big-O\n\nMeasuring time and space complexity…',
      },
      {
        title: 'Arrays & Linked Lists',
        slug: 'arrays-and-linked-lists',
        minutes: 25,
        content: '# Arrays vs Linked Lists\n\nTrade-offs…',
      },
      {
        title: 'Sorting Algorithms',
        slug: 'sorting-algorithms',
        minutes: 30,
        content: '# Sorting\n\nBubble, merge, and quick sort…',
      },
    ],
  });

  console.log('Creating badges…');
  for (const [name, description, icon, xpRequired] of BADGES) {
    await sql`INSERT INTO badges (name, description, icon, xp_required)
              VALUES (${name}, ${description}, ${icon}, ${xpRequired})`;
  }

  console.log('\n✓ Seed complete.');
  console.log(`  Admin:   ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`  Student: ${STUDENT.email} / ${STUDENT.password}`);
  console.log(
    `  Reference: Grades 1–12, ${SUBJECTS.length} subjects, ${PROGRAMMING_CATEGORIES.length} programming categories, Engineering → Computer Science.`,
  );
  console.log(`  Courses (${DEMO_COURSE_SLUGS.length}):`);
  console.log(
    `    "Intro to JavaScript" — K–12, Grade 10, Information Technology (published).`,
  );
  console.log(
    `                            Quiz (multiple-choice + numeric) and a coding challenge.`,
  );
  console.log(
    `    "${MATH_GRADE_12.title}" — K–12, Grade 12, Mathematics · Advanced track (Khmer).`,
  );
  console.log(
    `                            ${mathCounts.modules} modules / ${mathCounts.lessons} lessons / ` +
      `${mathCounts.quizzes} quizzes / ${mathCounts.questions} questions.`,
  );
  console.log(
    `    "${MATH_GRADE_12_BASIC.title}" — K–12, Grade 12, Mathematics · Basic track (Khmer).`,
  );
  console.log(
    `                            ${mathBasicCounts.modules} modules / ${mathBasicCounts.lessons} lessons / ` +
      `${mathBasicCounts.quizzes} quizzes / ${mathBasicCounts.questions} questions.`,
  );
  console.log(`    "English"              — K–12, Grade 12, English.`);
  console.log(
    `    "Python Fundamentals"  — programming, Programming Fundamentals.`,
  );
  console.log(`    "Web Dev with React"   — programming, Web Development.`);
  console.log(`    "Algorithms & DSA"     — programming, Computer Science.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
